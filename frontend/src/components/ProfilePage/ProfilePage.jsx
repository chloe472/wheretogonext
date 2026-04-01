import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Pencil,
  Share2,
  UserPlus,
  UserMinus,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Globe,
  Music,
  AtSign,
  ChevronDown,
} from 'lucide-react';
import {
  resolveTripCardCoverImage,
  getFlagImageForDestination,
  formatTripCardDateRange,
} from '../../data/tripDestinationMeta';
import { resolveImageUrl, applyImageFallback } from '../../lib/imageFallback';
import { fetchItineraryById, updateItinerary } from '../../api/itinerariesApi';
import {
  fetchMyProfile,
  fetchProfile,
  updateMyProfile,
  uploadProfilePhoto,
  addFriend,
  removeFriend,
  fetchFriendRequests,
  fetchOutgoingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
} from '../../api/profileApi';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import countriesData from '../../data/countries.json';
import { CITIES } from '../../data/cities';
import './ProfilePage.css';

const WORLD_GEOJSON_URL = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';
const MAP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const redFlagIcon = L.divIcon({
  className: 'profile-page__leaflet-marker',
  html: '<span class="profile-page__leaflet-pin"></span>',
  iconSize: [30, 36],
  iconAnchor: [15, 34],
  tooltipAnchor: [0, -20],
});

const COUNTRY_ALIAS_LOOKUP = {
  usa: 'United States',
  'u.s.a.': 'United States',
  'u.s.': 'United States',
  us: 'United States',
  uk: 'United Kingdom',
  'u.k.': 'United Kingdom',
  uae: 'United Arab Emirates',
  'u.a.e.': 'United Arab Emirates',
  korea: 'South Korea',
  'south korea': 'South Korea',
  'north korea': 'North Korea',
  'czech republic': 'Czechia',
  'ivory coast': "Cote d'Ivoire",
};

export default function ProfilePage({ user, onLogout, onUserUpdate }) {
  const [searchParams] = useSearchParams();
  const initialTab = (() => {
    const tab = String(searchParams.get('tab') || '').toLowerCase();
    if (tab === 'friends') return 'friends';
    if (tab === 'trips') return 'trips';
    return 'overview';
  })();
  const [activeTab, setActiveTab] = useState(initialTab);
  const { id: profileId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({ countries: 0, trips: 0, friends: 0 });
  const [trips, setTrips] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [isFriend, setIsFriend] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState('none');
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [outgoingLoading, setOutgoingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [geoData, setGeoData] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState({
    name: '',
    username: '',
    intro: '',
    interests: '',
    nationality: '',
    socials: [],
  });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [socialDraft, setSocialDraft] = useState({ platform: '', value: '' });
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTrip, setShareTrip] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareEmail, setShareEmail] = useState('');

  const isSelf = !profileId || (user?.id && String(profileId) === String(user.id));

  const countryNameMap = useMemo(() => {
    const map = new Map();
    countriesData.forEach((c) => {
      if (c?.name) map.set(String(c.name).toLowerCase(), c.name);
    });
    return map;
  }, []);

  const countryNameList = useMemo(
    () => countriesData.map((c) => c.name).filter(Boolean).sort((a, b) => b.length - a.length),
    []
  );

  const cityCountryMap = useMemo(() => {
    const map = new Map();
    CITIES.forEach((city) => {
      if (city?.name && city?.country) {
        map.set(String(city.name).toLowerCase(), city.country);
      }
    });
    return map;
  }, []);

  const normalizeSocials = (list) => {
    if (!Array.isArray(list)) return [];
    return list
      .map((s) => ({
        id: s?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        platform: s?.platform || '',
        url: s?.url || '',
        handle: s?.handle || '',
      }))
      .filter((s) => s.platform || s.url || s.handle);
  };

  const normalizeCountryName = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const lower = raw.toLowerCase();
    const alias = COUNTRY_ALIAS_LOOKUP[lower];
    const candidate = alias || raw;
    return countryNameMap.get(candidate.toLowerCase()) || '';
  };

  const extractCountryFromString = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const segments = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (segments.length > 1) {
      const last = normalizeCountryName(segments[segments.length - 1]);
      if (last) return last;
    }
    const direct = normalizeCountryName(raw);
    if (direct) return direct;
    const firstSegment = segments[0] || raw;
    return cityCountryMap.get(firstSegment.toLowerCase()) || '';
  };

  const findCountryInText = (value) => {
    const raw = String(value || '').toLowerCase();
    if (!raw) return '';
    for (const name of countryNameList) {
      if (raw.includes(name.toLowerCase())) return name;
    }
    return '';
  };

  const extractCountryFromTrip = (trip) => {
    if (!trip) return '';
    const candidates = [
      trip.destinationCountry,
      trip.destination,
      trip.locations,
      trip.overview,
      trip.title,
      trip.dates,
      ...(Array.isArray(trip.citySegments)
        ? trip.citySegments.map((seg) => seg.locationLabel || seg.city).filter(Boolean)
        : []),
      ...(Array.isArray(trip.places)
        ? trip.places.flatMap((p) => [p.address, p.name]).filter(Boolean)
        : []),
    ];
    for (const value of candidates) {
      const country = extractCountryFromString(value);
      if (country) return country;
    }
    for (const value of candidates) {
      const country = findCountryInText(value);
      if (country) return country;
    }
    return '';
  };

  const isPastTrip = (trip) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = trip?.endDate ? new Date(trip.endDate) : null;
    const start = trip?.startDate ? new Date(trip.startDate) : null;
    if (end && !Number.isNaN(end.getTime())) return end < today;
    if (start && !Number.isNaN(start.getTime())) return start < today;
    const datesText = String(trip?.dates || '').trim();
    if (datesText) {
      const monthMap = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
      };
      const matches = [...datesText.matchAll(/(\d{1,2})\s([A-Za-z]{3,})[^\d]*(\d{4})/g)];
      if (matches.length > 0) {
        const last = matches[matches.length - 1];
        const day = Number(last[1]);
        const monthKey = String(last[2]).slice(0, 3).toLowerCase();
        const year = Number(last[3]);
        const month = monthMap[monthKey];
        if (Number.isFinite(day) && Number.isFinite(year) && Number.isFinite(month)) {
          const parsedEnd = new Date(year, month, day);
          if (!Number.isNaN(parsedEnd.getTime())) return parsedEnd < today;
        }
      }
    }
    const status = String(trip?.status || '').toLowerCase();
    if (status.includes('complete') || status.includes('completed') || status.includes('done') || status.includes('past')) {
      return true;
    }
    return false;
  };

  const visitedCountries = useMemo(() => {
    const set = new Set();
    trips.forEach((trip) => {
      if (!isPastTrip(trip)) return;
      const country = extractCountryFromTrip(trip);
      if (country) set.add(country);
    });
    return Array.from(set);
  }, [trips]);

  const mapFlags = useMemo(() => {
    if (!geoData || !Array.isArray(geoData.features)) return [];
    const featureByName = new Map();
    geoData.features.forEach((feature) => {
      const name = feature?.properties?.name || feature?.properties?.ADMIN || feature?.properties?.admin;
      if (!name) return;
      const key = String(name).toLowerCase();
      featureByName.set(key, feature);
      if (key === 'united states of america') {
        featureByName.set('united states', feature);
        featureByName.set('usa', feature);
        featureByName.set('us', feature);
      }
    });

    const findFeatureForCountry = (country) => {
      const key = String(country || '').toLowerCase();
      if (!key) return null;
      if (featureByName.has(key)) return featureByName.get(key);
      return geoData.features.find((feature) => {
        const name = feature?.properties?.name || feature?.properties?.ADMIN || feature?.properties?.admin;
        if (!name) return false;
        const lname = String(name).toLowerCase();
        return lname.includes(key) || key.includes(lname);
      }) || null;
    };

    return visitedCountries
      .map((country) => {
        const feature = findFeatureForCountry(country);
        if (!feature) return null;
        const bounds = L.geoJSON(feature).getBounds();
        if (!bounds.isValid()) return null;
        const center = bounds.getCenter();
        return { name: country, position: [center.lat, center.lng] };
      })
      .filter(Boolean);
  }, [geoData, visitedCountries]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const loadGeo = async () => {
      setGeoLoading(true);
      setGeoError('');
      try {
        const res = await fetch(WORLD_GEOJSON_URL, { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to load map data.');
        const data = await res.json();
        if (!cancelled) setGeoData(data);
      } catch (err) {
        if (!cancelled) setGeoError(err?.message || 'Failed to load map data.');
      } finally {
        if (!cancelled) setGeoLoading(false);
      }
    };
    loadGeo();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const commitSocialDraft = () => {
    const platform = socialDraft.platform.trim();
    const value = socialDraft.value.trim();
    if (!platform && !value) return;
    const next = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      platform,
      url: value.startsWith('@') ? '' : value,
      handle: value.startsWith('@') ? value : '',
    };
    setEditDraft((prev) => ({
      ...prev,
      socials: [...prev.socials, next],
    }));
    setSocialDraft({ platform: '', value: '' });
  };

  const applyProfilePayload = (payload) => {
    const nextTrips = Array.isArray(payload?.trips) ? payload.trips : [];
    const nextFriends = Array.isArray(payload?.friends) ? payload.friends : [];
    setProfileData(payload?.profile || null);
    setStats({
      countries: payload?.stats?.countries ?? 0,
      trips: payload?.stats?.trips ?? nextTrips.length,
      friends: payload?.stats?.friends ?? nextFriends.length,
    });
    setTrips(nextTrips);
    setFriendsList(nextFriends);
    setIsFriend(Boolean(payload?.viewer?.isFriend));
    setRequestStatus(payload?.viewer?.requestStatus || 'none');
  };

  const refreshProfile = async () => {
    try {
      const payload = profileId
        ? await fetchProfile(profileId)
        : await fetchMyProfile();
      applyProfilePayload(payload);
    } catch (err) {
      setErrorMsg(err?.message || 'Could not load profile.');
    }
  };

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function loadProfile() {
      setLoading(true);
      setErrorMsg('');
      try {
        const payload = profileId
          ? await fetchProfile(profileId, { signal: controller.signal })
          : await fetchMyProfile({ signal: controller.signal });
        if (cancelled) return;
        applyProfilePayload(payload);
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err?.message || 'Could not load profile.');
        setProfileData(user || null);
        setStats({ countries: 0, trips: 0, friends: 0 });
        setTrips([]);
        setFriendsList([]);
        setIsFriend(false);
        setRequestStatus('none');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [profileId, user]);

  useEffect(() => {
    const tab = String(searchParams.get('tab') || '').toLowerCase();
    if (tab === 'friends' || tab === 'trips' || tab === 'overview') {
      setActiveTab(tab || 'overview');
      return;
    }
    setActiveTab('overview');
  }, [profileId, searchParams]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const loadRequests = async () => {
      setRequestsLoading(true);
      try {
        const data = await fetchFriendRequests();
        if (cancelled) return;
        setRequests(Array.isArray(data.requests) ? data.requests : []);
      } catch {
        if (!cancelled) setRequests([]);
      } finally {
        if (!cancelled) setRequestsLoading(false);
      }
    };
    loadRequests();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const loadOutgoing = async () => {
      setOutgoingLoading(true);
      try {
        const data = await fetchOutgoingFriendRequests();
        if (cancelled) return;
        setOutgoingRequests(Array.isArray(data.requests) ? data.requests : []);
      } catch {
        if (!cancelled) setOutgoingRequests([]);
      } finally {
        if (!cancelled) setOutgoingLoading(false);
      }
    };
    loadOutgoing();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const profile = profileData || user || {};
  const displayName = profile?.name || 'Traveler';
  const handle = profile?.username
    ? `@${profile.username}`
    : profile?.email
      ? `@${profile.email.split('@')[0]}`
      : '@traveler';
  const picture = profile?.picture;
  const incomingRequestId = profileData?.viewer?.requestId || null;
  const shareUrl = profile?.id || profileId
    ? `${window.location.origin}/profile/${profile?.id || profileId}`
    : `${window.location.origin}/profile`;
  const interestsList = Array.isArray(profile?.interests) ? profile.interests : [];
  const socialsList = Array.isArray(profile?.socials) ? profile.socials : [];

  const countries = [
    { label: 'Singapore', code: 'SG' },
    { label: 'Malaysia', code: 'MY' },
    { label: 'Indonesia', code: 'ID' },
    { label: 'Thailand', code: 'TH' },
    { label: 'Vietnam', code: 'VN' },
    { label: 'Philippines', code: 'PH' },
    { label: 'China', code: 'CN' },
    { label: 'Hong Kong', code: 'HK' },
    { label: 'Japan', code: 'JP' },
    { label: 'South Korea', code: 'KR' },
    { label: 'India', code: 'IN' },
    { label: 'Australia', code: 'AU' },
    { label: 'New Zealand', code: 'NZ' },
    { label: 'United Kingdom', code: 'GB' },
    { label: 'United States', code: 'US' },
    { label: 'Canada', code: 'CA' },
    { label: 'France', code: 'FR' },
    { label: 'Germany', code: 'DE' },
    { label: 'Italy', code: 'IT' },
    { label: 'Spain', code: 'ES' },
    { label: 'Netherlands', code: 'NL' },
    { label: 'Sweden', code: 'SE' },
    { label: 'Switzerland', code: 'CH' },
    { label: 'Brazil', code: 'BR' },
    { label: 'Mexico', code: 'MX' },
  ];

  const flagForCountry = (label) => {
    const match = countries.find((c) => c.label === label);
    const code = match?.code;
    if (!code) return '';
    return code
      .toUpperCase()
      .split('')
      .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
      .join('');
  };

  const platformIcon = (platform) => {
    const p = String(platform || '').toLowerCase();
    if (p.includes('facebook')) return <Facebook size={16} aria-hidden />;
    if (p.includes('instagram')) return <Instagram size={16} aria-hidden />;
    if (p.includes('tiktok')) return <Music size={16} aria-hidden />;
    if (p.includes('twitter') || p === 'x' || p.includes('x ')) return <Twitter size={16} aria-hidden />;
    if (p.includes('youtube')) return <Youtube size={16} aria-hidden />;
    if (p.includes('linkedin')) return <Linkedin size={16} aria-hidden />;
    if (p.includes('threads')) return <AtSign size={16} aria-hidden />;
    return <Globe size={16} aria-hidden />;
  };

  const handleShare = () => {
    if (!shareUrl.trim()) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
  };

  const getTripLink = (trip) => {
    if (!isSelf && trip.published && trip.visibility === 'public') {
      return `/itineraries/${trip.id}`;
    }
    return `/trip/${trip.id}`;
  };

  const handleFriendToggle = async () => {
    if (!profile?.id || isSelf || friendLoading) return;
    setFriendLoading(true);
    try {
      if (isFriend) {
        await removeFriend(profile.id);
        await refreshProfile();
      } else if (requestStatus === 'outgoing') {
        await removeFriend(profile.id);
        await refreshProfile();
      } else {
        await addFriend(profile.id);
        await refreshProfile();
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Could not update friend status.');
    } finally {
      setFriendLoading(false);
    }
  };

  const acceptRequest = async (requestId) => {
    const resolvedId = requestId
      || requests.find((r) => String(r.from?.id || '') === String(profile?.id || profileId || ''))?.id
      || null;
    if (!resolvedId) {
      setErrorMsg('Could not find that friend request.');
      return;
    }
    try {
      await acceptFriendRequest(resolvedId);
      setAcceptSuccess(true);
      const friendName = profile?.name || 'this traveler';
      toast.success(`You're now friends with ${friendName}.`);
      await refreshProfile();
    } catch (err) {
      setErrorMsg(err?.message || 'Could not accept request.');
    }
  };

  const declineRequest = async (requestId) => {
    if (!requestId) return;
    try {
      await declineFriendRequest(requestId);
      await refreshProfile();
    } catch (err) {
      setErrorMsg(err?.message || 'Could not decline request.');
    }
  };

  const removeFriendFromList = async (friendId) => {
    if (!friendId) return;
    try {
      await removeFriend(friendId);
      await refreshProfile();
    } catch (err) {
      setErrorMsg(err?.message || 'Could not remove friend.');
    }
  };

  const openShareTrip = async (trip) => {
    if (!trip?.id) return;
    setShareOpen(true);
    setShareLoading(true);
    setShareError('');
    setShareTrip({ ...trip });
    try {
      const full = await fetchItineraryById(trip.id);
      setShareTrip((prev) => ({
        ...prev,
        ...(full || {}),
        id: trip.id,
      }));
    } catch (err) {
      setShareError(err?.message || 'Failed to load collaborators.');
    } finally {
      setShareLoading(false);
    }
  };

  const closeShareTrip = () => {
    setShareOpen(false);
    setShareTrip(null);
    setShareEmail('');
    setShareError('');
  };

  const saveCollaborators = async (nextCollaborators) => {
    if (!shareTrip?.id) return;
    setShareLoading(true);
    setShareError('');
    try {
      const updated = await updateItinerary(shareTrip.id, { collaborators: nextCollaborators });
      setShareTrip((prev) => ({
        ...prev,
        collaborators: updated?.collaborators || nextCollaborators,
      }));
    } catch (err) {
      setShareError(err?.message || 'Failed to update collaborators.');
    } finally {
      setShareLoading(false);
    }
  };

  const handleInviteCollaborator = async () => {
    const email = shareEmail.trim().toLowerCase();
    if (!email) return;
    const existing = Array.isArray(shareTrip?.collaborators) ? shareTrip.collaborators : [];
    if (existing.some((c) => String(c.email || '').toLowerCase() === email)) {
      setShareError('This collaborator is already invited.');
      return;
    }
    const next = [...existing, { email, role: 'viewer' }];
    await saveCollaborators(next);
    setShareEmail('');
  };

  const handleRemoveCollaborator = async (email) => {
    if (!email) return;
    const existing = Array.isArray(shareTrip?.collaborators) ? shareTrip.collaborators : [];
    const next = existing.filter((c) => String(c.email || '').toLowerCase() !== String(email).toLowerCase());
    await saveCollaborators(next);
  };

  const handleCopyShareLink = async () => {
    if (!shareTrip?.id) return;
    const shareLink = `${window.location.origin}${getTripLink(shareTrip)}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Link copied.');
    } catch {
      // ignore
    }
  };

  const openEdit = () => {
    setEditError('');
    setEditDraft({
      name: profile?.name || '',
      username: profile?.username || '',
      intro: profile?.intro || '',
      interests: Array.isArray(profile?.interests) ? profile.interests.join(', ') : '',
      nationality: profile?.nationality || '',
      socials: normalizeSocials(profile?.socials),
    });
    setPhotoFile(null);
    setSocialDraft({ platform: '', value: '' });
    setEditOpen(true);
  };

  const saveProfile = async () => {
    if (editSaving) return;
    setEditError('');
    setEditSaving(true);
    try {
      if (photoFile) {
        setPhotoUploading(true);
        const uploadRes = await uploadProfilePhoto(photoFile);
        const uploadedProfile = uploadRes?.profile || {};
        setProfileData((prev) => ({ ...prev, ...uploadedProfile }));
        if (onUserUpdate) {
          onUserUpdate({
            ...user,
            ...uploadedProfile,
          });
        }
      }
      const payload = {
        name: editDraft.name.trim(),
        username: editDraft.username.trim(),
        intro: editDraft.intro.trim(),
        interests: editDraft.interests
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        nationality: editDraft.nationality.trim(),
        socials: Array.isArray(editDraft.socials)
          ? editDraft.socials.map(({ platform, url, handle }) => ({ platform, url, handle }))
          : [],
      };
      const res = await updateMyProfile(payload);
      const nextProfile = res?.profile || payload;
      setProfileData(nextProfile);
      setEditOpen(false);
      if (onUserUpdate) {
        onUserUpdate({
          ...user,
          ...nextProfile,
        });
      }
    } catch (err) {
      setEditError(err?.message || 'Could not update profile.');
    } finally {
      setPhotoUploading(false);
      setEditSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <DashboardHeader user={user} onLogout={onLogout} activeNav="dashboard" />

      <main className="profile-page__main">
        <section className="profile-page__cover" />
        <Link to="/" className="profile-page__back-btn">
          <span className="profile-page__back-icon" aria-hidden>←</span>
          <span>Back</span>
        </Link>

        <section className="profile-page__card-wrap">
          <article className="profile-page__card">
            <header className="profile-page__header">
              <div className="profile-page__avatar-wrap">
                <div className="profile-page__avatar-border">
                  <div className="profile-page__avatar-inner">
                    {picture ? (
                      <img src={picture} alt="" />
                    ) : (
                      <div className="profile-page__avatar-placeholder">
                        {(displayName || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="profile-page__identity">
                <h1 className="profile-page__name">{displayName}</h1>
                {profile?.intro && (
                  <p className="profile-page__subtitle profile-page__subtitle--intro">{profile.intro}</p>
                )}
                <div className="profile-page__meta">
                  <span className="profile-page__handle">{handle}</span>
                </div>
                {socialsList.length > 0 && (
                  <div className="profile-page__meta profile-page__meta--inline">
                    {socialsList.map((s, idx) => (
                      <span key={`${s.platform}-${idx}`} className="profile-page__social-inline">
                        <span className="profile-page__social-icon">{platformIcon(s.platform)}</span>
                        <span className="profile-page__social-platform-label">{s.platform || 'Social'}</span>
                        {(s.handle || s.url) && (
                          <span className="profile-page__social-handle">{s.handle || s.url}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {profile?.nationality && (
                  <div className="profile-page__meta profile-page__meta--stack">
                    <span className="profile-page__meta-label">Nationality</span>
                    <span className="profile-page__meta-value">
                      {`${flagForCountry(profile.nationality)} ${profile.nationality}`}
                    </span>
                  </div>
                )}
                {!profile?.intro && (
                  <p className="profile-page__subtitle profile-page__subtitle--intro profile-page__subtitle--placeholder">
                    Add a short intro about your travel style.
                  </p>
                )}
              </div>
              <div className="profile-page__actions">
                {isSelf && (
                  <button type="button" className="profile-page__btn profile-page__btn--primary" onClick={openEdit}>
                    <Pencil size={16} aria-hidden />
                    <span>Edit profile</span>
                  </button>
                )}
                {!isSelf && requestStatus === 'incoming' && (
                  <div className="profile-page__incoming-actions">
                    <button
                      type="button"
                      className="profile-page__btn profile-page__btn--primary"
                      onClick={() => acceptRequest(incomingRequestId)}
                    >
                      Accept
                    </button>
                  </div>
                )}
                {!isSelf && requestStatus !== 'incoming' && (
                  <button
                    type="button"
                    className={`profile-page__btn ${isFriend ? 'profile-page__btn--ghost' : 'profile-page__btn--primary'}`}
                    onClick={handleFriendToggle}
                    disabled={friendLoading}
                  >
                    {isFriend || requestStatus === 'outgoing' ? (
                      <UserMinus size={16} aria-hidden />
                    ) : (
                      <UserPlus size={16} aria-hidden />
                    )}
                    <span>
                      {isFriend
                        ? 'Unfriend'
                        : requestStatus === 'outgoing'
                          ? 'Request sent'
                          : 'Add friend'}
                    </span>
                  </button>
                )}
                <button type="button" className="profile-page__btn" onClick={handleShare}>
                  <Share2 size={16} aria-hidden />
                  <span>Share</span>
                </button>
              </div>
            </header>

            <section className="profile-page__stats">
              <div className="profile-page__stat">
                <span className="profile-page__stat-number">{stats.countries}</span>
                <span className="profile-page__stat-label">Countries</span>
              </div>
              <div className="profile-page__stat">
                <span className="profile-page__stat-number">{stats.trips}</span>
                <span className="profile-page__stat-label">Trips</span>
              </div>
              <div className="profile-page__stat">
                <span className="profile-page__stat-number">{stats.friends}</span>
                <span className="profile-page__stat-label">Friends</span>
              </div>
            </section>

            <nav className="profile-page__tabs" aria-label="Profile sections">
              <button
                type="button"
                className={`profile-page__tab ${activeTab === 'overview' ? 'profile-page__tab--active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview & Map
              </button>
              <button
                type="button"
                className={`profile-page__tab ${activeTab === 'trips' ? 'profile-page__tab--active' : ''}`}
                onClick={() => setActiveTab('trips')}
              >
                {isSelf ? 'My Trips' : 'Trips'}
              </button>
              <button
                type="button"
                className={`profile-page__tab ${activeTab === 'friends' ? 'profile-page__tab--active' : ''}`}
                onClick={() => setActiveTab('friends')}
              >
                {isSelf ? 'My Friends' : 'Friends'}
              </button>
            </nav>

            <section className="profile-page__content">
              {loading && <p className="profile-page__empty">Loading profile...</p>}
              {errorMsg && !loading && <p className="profile-page__empty profile-page__error">{errorMsg}</p>}
              {activeTab === 'overview' && (
                <>
                  <h2 className="profile-page__section-title">{isSelf ? 'My World Map' : 'World Map'}</h2>
                  <div className="profile-page__map-card">
                    {geoLoading && (
                      <div className="profile-page__map-empty">Loading map…</div>
                    )}
                    {geoError && !geoLoading && (
                      <div className="profile-page__map-empty">{geoError}</div>
                    )}
                    {!geoLoading && !geoError && (
                      <MapContainer
                        center={[20, 0]}
                        zoom={2}
                        minZoom={1}
                        scrollWheelZoom
                        className="profile-page__map"
                      >
                        <TileLayer attribution={MAP_ATTRIBUTION} url={MAP_TILE_URL} />
                        {geoData && (
                          <GeoJSON
                            data={geoData}
                            style={{
                              color: '#d9c7b5',
                              weight: 1,
                              fillColor: '#f8f3ee',
                              fillOpacity: 0.7,
                            }}
                          />
                        )}
                        {mapFlags.map((flag) => (
                          <Marker key={flag.name} position={flag.position} icon={redFlagIcon}>
                            <Tooltip>{flag.name}</Tooltip>
                          </Marker>
                        ))}
                      </MapContainer>
                    )}
                    {!geoLoading && !geoError && mapFlags.length === 0 && (
                      <div className="profile-page__map-empty profile-page__map-empty--overlay">
                        No trips yet — your travel flags will appear here.
                      </div>
                    )}
                  </div>
                </>
              )}
              {activeTab === 'trips' && (
                <>
                  <h2 className="profile-page__section-title">{isSelf ? 'My Trips' : 'Trips'}</h2>
                  {trips.length === 0 ? (
                    <p className="profile-page__empty">
                      {isSelf ? 'No trips yet.' : 'No trips yet for this traveler.'}
                    </p>
                  ) : (
                    <ul className="dashboard__trip-list profile-page__trip-grid">
                      {trips.map((trip) => {
                        const tripDestination = trip.destination || trip.locations || '';
                        const coverImage = resolveTripCardCoverImage(trip, tripDestination);
                        const flagImage = getFlagImageForDestination(tripDestination);
                        const dateLabel = formatTripCardDateRange(trip?.startDate, trip?.endDate, trip?.dates);
                        return (
                          <li
                            key={trip.id}
                            className="trip-card"
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              window.location.href = getTripLink(trip);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                window.location.href = getTripLink(trip);
                              }
                            }}
                          >
                            <div className="trip-card__image-wrap">
                              <div className="trip-card__image-crop">
                                <img
                                  src={resolveImageUrl(coverImage)}
                                  alt=""
                                  className="trip-card__image"
                                  onError={(e) => applyImageFallback(e, coverImage)}
                                />
                              </div>
                              {flagImage?.url ? (
                                <img
                                  src={flagImage.url}
                                  alt={`${flagImage.countryName} flag`}
                                  className="trip-card__flag"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : null}
                              <div className="trip-card__status-wrap">
                                <div className="trip-card__status-btn trip-card__status--planning">
                                  <span className="trip-card__status-btn-text">{trip.status || 'Planning'}</span>
                                  <ChevronDown size={14} className="trip-card__status-chevron" aria-hidden />
                                </div>
                              </div>
                              {isSelf && (
                                <button
                                  type="button"
                                  className="trip-card__share-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openShareTrip(trip);
                                  }}
                                >
                                  <Share2 size={16} aria-hidden />
                                  Share
                                </button>
                              )}
                            </div>
                            <div className="trip-card__body">
                              <h3 className="trip-card__title">{trip.title || 'Untitled trip'}</h3>
                              {trip.published && trip.visibility === 'public' ? (
                                <span className="trip-card__published-badge">Published</span>
                              ) : null}
                              <p className="trip-card__dates">{dateLabel}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
              {activeTab === 'friends' && (
                <>
                  <h2 className="profile-page__section-title">{isSelf ? 'My Friends' : 'Friends'}</h2>
                  {isSelf && (
                    <div className="profile-page__friend-section">
                      <h3 className="profile-page__requests-title">Friend Requests</h3>
                      {requestsLoading ? (
                        <p className="profile-page__empty">Loading requests...</p>
                      ) : requests.length === 0 ? (
                        <p className="profile-page__empty">No new requests.</p>
                      ) : (
                        <ul className="profile-page__requests-list">
                          {requests.map((req) => (
                            <li key={req.id} className="profile-page__request-card">
                              <Link to={`/profile/${req.from.id}`} className="profile-page__friend-card">
                                <div className="profile-page__friend-avatar">
                                  {req.from.picture ? (
                                    <img src={req.from.picture} alt="" />
                                  ) : (
                                    <span>{(req.from.name || '?').charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="profile-page__friend-info">
                                  <span className="profile-page__friend-name">{req.from.name || 'Traveler'}</span>
                                  <span className="profile-page__friend-handle">
                                    {req.from.username ? `@${req.from.username}` : ''}
                                  </span>
                                </div>
                              </Link>
                              <div className="profile-page__request-actions">
                                <button type="button" onClick={() => acceptRequest(req.id)} className="profile-page__btn profile-page__btn--primary">
                                  Accept
                                </button>
                                <button type="button" onClick={() => declineRequest(req.id)} className="profile-page__btn profile-page__btn--ghost">
                                  Decline
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {isSelf && (
                    <div className="profile-page__friend-section">
                      <h3 className="profile-page__requests-title">Requests Sent</h3>
                      {outgoingLoading ? (
                        <p className="profile-page__empty">Loading requests...</p>
                      ) : outgoingRequests.length === 0 ? (
                        <p className="profile-page__empty">No pending requests.</p>
                      ) : (
                        <ul className="profile-page__requests-list">
                          {outgoingRequests.map((req) => (
                            <li key={req.id} className="profile-page__request-card">
                              <Link to={`/profile/${req.to.id}`} className="profile-page__friend-card">
                                <div className="profile-page__friend-avatar">
                                  {req.to.picture ? (
                                    <img src={req.to.picture} alt="" />
                                  ) : (
                                    <span>{(req.to.name || '?').charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="profile-page__friend-info">
                                  <span className="profile-page__friend-name">{req.to.name || 'Traveler'}</span>
                                  <span className="profile-page__friend-handle">
                                    {req.to.username ? `@${req.to.username}` : ''}
                                  </span>
                                </div>
                              </Link>
                              <div className="profile-page__request-actions">
                                <button type="button" onClick={() => declineRequest(req.id)} className="profile-page__btn profile-page__btn--ghost">
                                  Cancel
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  <div className="profile-page__friend-section">
                    <h3 className="profile-page__requests-title">{isSelf ? 'Friends' : 'Friends List'}</h3>
                    {friendsList.length === 0 ? (
                      <p className="profile-page__empty">
                        {isSelf ? 'No friends yet.' : 'No friends to show yet.'}
                      </p>
                    ) : (
                      <ul className="profile-page__friends-list">
                        {friendsList.map((friend) => (
                          <li key={friend.id}>
                            <Link to={`/profile/${friend.id}`} className="profile-page__friend-card">
                              <div className="profile-page__friend-avatar">
                                {friend.picture ? (
                                  <img src={friend.picture} alt="" />
                                ) : (
                                  <span>{(friend.name || '?').charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="profile-page__friend-info">
                                <span className="profile-page__friend-name">{friend.name || 'Traveler'}</span>
                                <span className="profile-page__friend-handle">
                                  {friend.username ? `@${friend.username}` : ''}
                                </span>
                              </div>
                              <span className="profile-page__friend-arrow" aria-hidden>→</span>
                            </Link>
                            {isSelf && (
                              <button
                                type="button"
                                className="profile-page__friend-remove"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeFriendFromList(friend.id);
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </section>
          </article>
        </section>
      </main>

      {editOpen && (
        <div className="profile-page__modal" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
          <button
            type="button"
            className="profile-page__modal-backdrop"
            aria-label="Close"
            onClick={() => setEditOpen(false)}
          />
          <div className="profile-page__modal-card">
            <div className="profile-page__modal-head">
              <h2 id="edit-profile-title" className="profile-page__modal-title">Edit profile</h2>
              <button type="button" className="profile-page__modal-close" onClick={() => setEditOpen(false)}>
                ✕
              </button>
            </div>
            <div className="profile-page__modal-body">
              <div className="profile-page__edit-grid profile-page__edit-grid--stacked">
                <div className="profile-page__edit-avatar profile-page__edit-avatar--top">
                  <div className="profile-page__avatar-border">
                    <div className="profile-page__avatar-inner">
                      {picture ? (
                        <img src={picture} alt="" />
                      ) : (
                        <div className="profile-page__avatar-placeholder">
                          {(displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <label className="profile-page__upload-btn">
                    Upload from device
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {photoFile && (
                    <p className="profile-page__modal-file">Selected: {photoFile.name}</p>
                  )}
                </div>
                <div className="profile-page__edit-fields">
              <label className="profile-page__modal-label" htmlFor="profile-name">
                Name
              </label>
              <input
                id="profile-name"
                className="profile-page__modal-input"
                value={editDraft.name}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
              />
              <label className="profile-page__modal-label" htmlFor="profile-username">
                Username
              </label>
              <input
                id="profile-username"
                className="profile-page__modal-input"
                value={editDraft.username}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="username"
              />
              <label className="profile-page__modal-label" htmlFor="profile-intro">
                Intro
              </label>
              <textarea
                id="profile-intro"
                className="profile-page__modal-textarea"
                rows={4}
                value={editDraft.intro}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, intro: e.target.value }))}
                placeholder="Introduce yourself..."
              />
              <label className="profile-page__modal-label" htmlFor="profile-interests">
                Interested in
              </label>
              <input
                id="profile-interests"
                className="profile-page__modal-input"
                value={editDraft.interests}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, interests: e.target.value }))}
                placeholder="Beach, Foodie, Culture..."
              />
              <label className="profile-page__modal-label" htmlFor="profile-nationality">
                Nationality
              </label>
              <select
                id="profile-nationality"
                className="profile-page__modal-input profile-page__modal-select"
                value={editDraft.nationality}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, nationality: e.target.value }))}
              >
                <option value="">Select nationality</option>
                {!countries.some((c) => c.label === editDraft.nationality) && editDraft.nationality && (
                  <option value={editDraft.nationality}>{editDraft.nationality}</option>
                )}
                {countries.map((c) => (
                  <option key={c.code} value={c.label}>{`${c.label} ${flagForCountry(c.label)}`}</option>
                ))}
              </select>
              <div className="profile-page__socials-edit">
                <p className="profile-page__modal-label">Social Profiles</p>
                <div className="profile-page__social-input">
                  <div className="profile-page__social-input-icon">
                    {platformIcon(socialDraft.platform)}
                  </div>
                  <input
                    className="profile-page__modal-input profile-page__social-platform"
                    list="social-platforms"
                    value={socialDraft.platform}
                    onChange={(e) => setSocialDraft((prev) => ({ ...prev, platform: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitSocialDraft();
                      }
                    }}
                    placeholder="Platform"
                  />
                  <input
                    className="profile-page__modal-input profile-page__social-handle-input"
                    value={socialDraft.value}
                    onChange={(e) => setSocialDraft((prev) => ({ ...prev, value: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitSocialDraft();
                      }
                    }}
                    placeholder="@handle or https://"
                  />
                  <button
                    type="button"
                    className="profile-page__social-add-btn"
                    onClick={commitSocialDraft}
                  >
                    Add
                  </button>
                </div>
                {editDraft.socials.length > 0 && (
                  <ul className="profile-page__socials-list">
                    {editDraft.socials.map((s) => (
                      <li key={s.id} className="profile-page__social-pill">
                        <span className="profile-page__social-icon">{platformIcon(s.platform)}</span>
                        <div className="profile-page__social-text">
                          <span className="profile-page__social-platform-label">{s.platform || 'Social'}</span>
                          <span className="profile-page__social-handle">
                            {(s.handle || s.url) ? `${s.handle || s.url}` : 'Not set'}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="profile-page__social-remove profile-page__social-remove--pill"
                          onClick={() => {
                            const next = editDraft.socials.filter((x) => x.id !== s.id);
                            setEditDraft((prev) => ({ ...prev, socials: next }));
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  className="profile-page__social-add"
                  onClick={commitSocialDraft}
                >
                  + Add social profile
                </button>
                <datalist id="social-platforms">
                  <option value="Facebook" />
                  <option value="Instagram" />
                  <option value="TikTok" />
                  <option value="X (Twitter)" />
                  <option value="YouTube" />
                  <option value="LinkedIn" />
                  <option value="Pinterest" />
                  <option value="Threads" />
                </datalist>
              </div>
              {editError && <p className="profile-page__modal-error">{editError}</p>}
                </div>
              </div>
            </div>
            <div className="profile-page__modal-actions">
              <button type="button" className="profile-page__modal-btn profile-page__modal-btn--ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="profile-page__modal-btn profile-page__modal-btn--primary"
                onClick={saveProfile}
                disabled={editSaving || photoUploading}
              >
                {editSaving || photoUploading ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {shareOpen && (
        <div className="profile-page__modal" role="dialog" aria-modal="true" aria-labelledby="share-trip-title">
          <button
            type="button"
            className="profile-page__modal-backdrop"
            aria-label="Close"
            onClick={closeShareTrip}
          />
          <div className="profile-page__share-card">
            <div className="profile-page__modal-head">
              <h2 id="share-trip-title" className="profile-page__modal-title">Share with people</h2>
              <button type="button" className="profile-page__modal-close" onClick={closeShareTrip}>
                ✕
              </button>
            </div>
            <div className="profile-page__modal-body">
              <label className="profile-page__modal-label" htmlFor="share-email">Invite by email</label>
              <div className="profile-page__share-row">
                <input
                  id="share-email"
                  className="profile-page__modal-input"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="name@email.com"
                />
                <button
                  type="button"
                  className="profile-page__btn profile-page__btn--primary"
                  onClick={handleInviteCollaborator}
                  disabled={shareLoading}
                >
                  Send invite
                </button>
              </div>
              {shareError && <p className="profile-page__modal-error">{shareError}</p>}
              <div className="profile-page__share-list">
                {shareLoading && <p className="profile-page__empty">Loading collaborators…</p>}
                {!shareLoading && (shareTrip?.collaborators?.length || 0) === 0 && (
                  <p className="profile-page__empty">No collaborators yet.</p>
                )}
                {!shareLoading && (shareTrip?.collaborators?.length || 0) > 0 && (
                  <ul className="profile-page__collab-list">
                    {shareTrip.collaborators.map((c) => (
                      <li key={c.email} className="profile-page__collab-item">
                        <span className="profile-page__collab-email">{c.email}</span>
                        <span className="profile-page__collab-role">Can view</span>
                        <button
                          type="button"
                          className="profile-page__collab-remove"
                          onClick={() => handleRemoveCollaborator(c.email)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="profile-page__modal-actions">
              <button type="button" className="profile-page__modal-btn profile-page__modal-btn--ghost" onClick={closeShareTrip}>
                Close
              </button>
              <button type="button" className="profile-page__modal-btn profile-page__modal-btn--primary" onClick={handleCopyShareLink}>
                Copy planner link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

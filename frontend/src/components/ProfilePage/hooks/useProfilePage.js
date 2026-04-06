import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  fetchItineraryById,
  updateItinerary,
  duplicateItinerary,
  deleteItinerary,
  shareItineraryWithFriends,
} from '../../../api/itinerariesApi';
import {
  fetchMyProfile,
  fetchProfile,
  updateMyProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
  addFriend,
  removeFriend,
  fetchFriendRequests,
  fetchOutgoingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  searchUserByIdentifier,
  addMapDestination,
  shareProfileWithFriends,
  lookupUserByEmail,
} from '../../../api/profileApi';
import { fetchCitySuggestions } from '../../../api/locationsApi';

const WORLD_GEOJSON_URL = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';

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

export function useProfilePage({
  user,
  profileId,
  searchParams,
  onUserUpdate,
}) {
  const params = searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams();
  const initialTab = (() => {
    const tab = String(params.get('tab') || '').toLowerCase();
    if (tab === 'friends') return 'friends';
    if (tab === 'trips') return 'trips';
    return 'overview';
  })();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({ countries: 0, trips: 0, friends: 0 });
  const [trips, setTrips] = useState([]);
  const [tripStatuses, setTripStatuses] = useState({});
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState(null);
  const statusDropdownRef = useRef(null);
  const [openOwnerMenuId, setOpenOwnerMenuId] = useState(null);
  const ownerMenuRef = useRef(null);
  const [publishTarget, setPublishTarget] = useState(null);
  const [coverImageTarget, setCoverImageTarget] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameTitleDraft, setRenameTitleDraft] = useState('');
  const DIALOG_CLOSED = {
    open: false,
    title: '',
    message: '',
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: null,
  };
  const [dialog, setDialog] = useState(DIALOG_CLOSED);
  const closeDialog = () => setDialog(DIALOG_CLOSED);
  const [friendsList, setFriendsList] = useState([]);
  const [mapDestinations, setMapDestinations] = useState([]);
  const [isFriend, setIsFriend] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState('none');
  const [viewerRequestId, setViewerRequestId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [outgoingLoading, setOutgoingLoading] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [addFriendValue, setAddFriendValue] = useState('');
  const [addFriendError, setAddFriendError] = useState('');
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [addFriendResults, setAddFriendResults] = useState([]);
  const [addFriendSelectedId, setAddFriendSelectedId] = useState(null);
  const [addFriendSearching, setAddFriendSearching] = useState(false);
  const [profileShareOpen, setProfileShareOpen] = useState(false);
  const [profileShareSelectedIds, setProfileShareSelectedIds] = useState([]);
  const [profileShareSending, setProfileShareSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [geoData, setGeoData] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [addDestinationOpen, setAddDestinationOpen] = useState(false);
  const [destinationCountry, setDestinationCountry] = useState('');
  const [destinationCountryInput, setDestinationCountryInput] = useState('');
  const [destinationCountryOpen, setDestinationCountryOpen] = useState(false);
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationCityOpen, setDestinationCityOpen] = useState(false);
  const [destinationCountrySuggestions, setDestinationCountrySuggestions] = useState([]);
  const [destinationCitySuggestions, setDestinationCitySuggestions] = useState([]);
  const [destinationSuggestionsLoading, setDestinationSuggestionsLoading] = useState(false);
  const [destinationError, setDestinationError] = useState('');
  const [destinationLoading, setDestinationLoading] = useState(false);
  const countryDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState({
    name: '',
    intro: '',
    interests: [],
    nationality: '',
    socials: [],
  });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [socialDraft, setSocialDraft] = useState({ platform: '', value: '' });
  const [statsListOpen, setStatsListOpen] = useState(null); // 'countries' | 'cities' | null
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTrip, setShareTrip] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);

  const isSelf = !profileId || (user?.id && String(profileId) === String(user.id));

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
    return COUNTRY_ALIAS_LOOKUP[lower] || raw;
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
    return '';
  };

  const findCountryInText = (value) => {
    return extractCountryFromString(value);
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

  const extractCityFromString = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const first = raw.split(',')[0]?.trim();
    if (!first) return '';
    return first;
  };

  const extractCitiesFromTrip = (trip) => {
    if (!trip) return [];
    const candidates = [
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
    const result = new Set();
    candidates.forEach((value) => {
      const city = extractCityFromString(value);
      if (city) result.add(city);
    });
    return Array.from(result);
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
    mapDestinations.forEach((dest) => {
      if (dest?.country) set.add(dest.country);
    });
    return Array.from(set);
  }, [trips, mapDestinations]);

  const visitedCities = useMemo(() => {
    const set = new Set();
    trips.forEach((trip) => {
      if (!isPastTrip(trip)) return;
      extractCitiesFromTrip(trip).forEach((city) => set.add(city));
    });
    mapDestinations.forEach((dest) => {
      if (dest?.city) set.add(dest.city);
    });
    return Array.from(set);
  }, [trips, mapDestinations]);

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

  const countriesCount = visitedCountries.length;
  const citiesCount = visitedCities.length;

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
    setMapDestinations(Array.isArray(payload?.profile?.mapDestinations) ? payload.profile.mapDestinations : []);
    setStats({
      countries: payload?.stats?.countries ?? 0,
      trips: payload?.stats?.trips ?? nextTrips.length,
      friends: payload?.stats?.friends ?? nextFriends.length,
    });
    setTrips(nextTrips);
    setFriendsList(nextFriends);
    setIsFriend(Boolean(payload?.viewer?.isFriend));
    setRequestStatus(payload?.viewer?.requestStatus || 'none');
    setViewerRequestId(payload?.viewer?.requestId || null);
  };

  useEffect(() => {
    setTripStatuses((prev) => {
      const next = { ...prev };
      trips.forEach((t) => {
        if (next[t.id] === undefined) next[t.id] = t.status || 'Planning';
      });
      return next;
    });
  }, [trips]);

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
    function handleClickOutside(e) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setOpenStatusDropdownId(null);
      }
      if (ownerMenuRef.current && !ownerMenuRef.current.contains(e.target)) {
        setOpenOwnerMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const picture = profile?.picture;
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

  const handleShare = () => {
    setProfileShareSelectedIds([]);
    setProfileShareOpen(true);
  };

  const handleProfileShareInviteByEmail = async (email) => {
    try {
      const lookup = await lookupUserByEmail(email);
      const userId = lookup?.user?.id ? String(lookup.user.id) : '';
      if (!userId) throw new Error('No account found for that email.');
      await shareProfileWithFriends([userId]);
      toast.success('Profile shared!');
    } catch (err) {
      throw new Error(err?.message || 'Could not send invite.');
    }
  };

  const handleProfileShareInviteByUser = async (searchUser) => {
    const userId = String(searchUser?.id || '');
    if (!userId) throw new Error('Invalid user.');
    await shareProfileWithFriends([userId]);
    toast.success('Profile shared!');
  };

  const handleProfileShareToggleFriend = (friendId) => {
    setProfileShareSelectedIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleProfileShareSend = async () => {
    if (profileShareSelectedIds.length === 0) return;
    setProfileShareSending(true);
    try {
      await shareProfileWithFriends(profileShareSelectedIds);
      toast.success('Profile shared!');
      setProfileShareOpen(false);
      setProfileShareSelectedIds([]);
    } catch (err) {
      toast.error(err?.message || 'Could not share profile.');
    } finally {
      setProfileShareSending(false);
    }
  };

  const handleProfileShareCopyLink = () => {
    if (!shareUrl.trim()) return;
    navigator.clipboard.writeText(shareUrl)
      .then(() => toast.success('Profile link copied!'))
      .catch(() => toast.error('Could not copy link.'));
  };

  const getTripLink = (trip) => {
    if (!isSelf && trip.published && trip.visibility === 'public') {
      return `/itineraries/${trip.id}`;
    }
    return `/trip/${trip.id}`;
  };

  const refreshRequests = async () => {
    try {
      const [incoming, outgoing] = await Promise.all([fetchFriendRequests(), fetchOutgoingFriendRequests()]);
      setRequests(incoming?.requests || []);
      setOutgoingRequests(outgoing?.requests || []);
    } catch {
      // ignore
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
      const friendName = profile?.name || 'this traveler';
      toast.success(`You're now friends with ${friendName}.`);
      await Promise.all([refreshProfile(), refreshRequests()]);
    } catch (err) {
      setErrorMsg(err?.message || 'Could not accept request.');
    }
  };

  const declineRequest = async (requestId) => {
    if (!requestId) return;
    try {
      await declineFriendRequest(requestId);
      await Promise.all([refreshProfile(), refreshRequests()]);
    } catch (err) {
      setErrorMsg(err?.message || 'Could not decline request.');
    }
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
        await Promise.all([refreshProfile(), refreshRequests()]);
      } else if (requestStatus === 'incoming') {
        await acceptRequest(viewerRequestId);
      } else {
        await addFriend(profile.id);
        await Promise.all([refreshProfile(), refreshRequests()]);
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Could not update friend status.');
    } finally {
      setFriendLoading(false);
    }
  };

  useEffect(() => {
    if (!addFriendOpen) return;
    const trimmed = addFriendValue.trim();
    if (trimmed.length < 2) {
      setAddFriendResults([]);
      setAddFriendSelectedId(null);
      setAddFriendError('');
      setAddFriendSearching(false);
      return;
    }
    setAddFriendSearching(true);
    setAddFriendResults([]);
    setAddFriendSelectedId(null);
    setAddFriendError('');
    const timer = setTimeout(async () => {
      try {
        const data = await searchUserByIdentifier(trimmed);
        const found = Array.isArray(data?.users) ? data.users : [];
        setAddFriendResults(found);
        if (found.length === 0) setAddFriendError('No user found.');
      } catch (err) {
        setAddFriendResults([]);
        setAddFriendError(err?.message || 'Search failed.');
      } finally {
        setAddFriendSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [addFriendValue, addFriendOpen]);

  useEffect(() => {
    if (!addDestinationOpen) return () => {};

    const query = String(destinationCity || destinationCountryInput || '').trim();
    if (query.length < 2) {
      setDestinationCitySuggestions([]);
      setDestinationCountrySuggestions([]);
      setDestinationSuggestionsLoading(false);
      return () => {};
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setDestinationSuggestionsLoading(true);
      try {
        const next = await fetchCitySuggestions(query, { signal: controller.signal, limit: 16 });
        const cityList = Array.isArray(next) ? next : [];
        setDestinationCitySuggestions(cityList);

        const seenCountries = new Set();
        const countryList = [];
        cityList.forEach((item) => {
          const country = String(item?.country || '').trim();
          if (!country) return;
          const key = country.toLowerCase();
          if (seenCountries.has(key)) return;
          seenCountries.add(key);
          countryList.push(country);
        });
        setDestinationCountrySuggestions(countryList.slice(0, 16));
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setDestinationCitySuggestions([]);
          setDestinationCountrySuggestions([]);
        }
      } finally {
        setDestinationSuggestionsLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [addDestinationOpen, destinationCity, destinationCountryInput]);

  const submitAddFriend = async () => {
    const selected = addFriendResults.find((u) => u.id === addFriendSelectedId) || null;
    if (!selected) return;
    setAddFriendError('');
    setAddFriendLoading(true);
    try {
      const res = await addFriend(selected.id);
      if (res?.status === 'friends') {
        toast('You are already friends.');
      } else {
        toast.success('Friend request sent!');
      }
      setAddFriendValue('');
      setAddFriendResults([]);
      setAddFriendSelectedId(null);
      setAddFriendOpen(false);
      await refreshProfile();
      try {
        const [incoming, outgoing] = await Promise.all([fetchFriendRequests(), fetchOutgoingFriendRequests()]);
        setRequests(incoming?.requests || []);
        setOutgoingRequests(outgoing?.requests || []);
      } catch {
        // ignore refresh errors
      }
    } catch (err) {
      setAddFriendError(err?.message || 'Request failed.');
    } finally {
      setAddFriendLoading(false);
    }
  };

  const submitDestination = async () => {
    const countryValue = destinationCountry.trim() || destinationCountryInput.trim();
    if (!countryValue) {
      setDestinationError('Please enter a country.');
      return;
    }
    setDestinationError('');
    setDestinationLoading(true);
    try {
      const res = await addMapDestination({
        country: countryValue,
        city: destinationCity.trim(),
      });
      if (res?.profile) {
        setProfileData(res.profile);
        setMapDestinations(Array.isArray(res.profile.mapDestinations) ? res.profile.mapDestinations : []);
      } else {
        await refreshProfile();
      }
      setDestinationCountry('');
      setDestinationCountryInput('');
      setDestinationCity('');
      setAddDestinationOpen(false);
      toast.success('Destination added!');
    } catch (err) {
      setDestinationError(err?.message || 'Failed to add destination.');
    } finally {
      setDestinationLoading(false);
    }
  };

  const setTripStatus = async (tripId, status) => {
    setTripStatuses((prev) => ({ ...prev, [tripId]: status }));
    setOpenStatusDropdownId(null);
    try {
      await updateItinerary(tripId, { status });
      setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, status } : t)));
    } catch (err) {
      toast.error(err?.message || 'Could not update status.');
    }
  };

  const applyRenameFromModal = async () => {
    const title = renameTitleDraft.trim();
    if (!renameTarget || !title) return;
    try {
      await updateItinerary(renameTarget.id, { title });
      setTrips((prev) => prev.map((t) => (t.id === renameTarget.id ? { ...t, title } : t)));
      setRenameTarget(null);
      setRenameTitleDraft('');
      toast.success('Trip renamed');
    } catch (err) {
      toast.error(err?.message || 'Could not rename trip.');
    }
  };

  const handleItineraryOwnerMenu = async (trip, action) => {
    if (!trip) return;
    if (action === 'share') {
      await openShareTrip(trip);
      return;
    }
    if (action === 'publish') {
      if (trip.published && trip.visibility === 'public') {
        try {
          await updateItinerary(trip.id, { published: false, visibility: 'private', publishedAt: null });
          setTrips((prev) => prev.map((t) => t.id === trip.id ? { ...t, published: false, visibility: 'private' } : t));
          toast.success('Trip moved to private');
        } catch (e) {
          toast.error(e?.message || 'Could not make this trip private.');
        }
        return;
      }
      try {
        const full = await fetchItineraryById(trip.id);
        setPublishTarget({ itinerary: full, initialStep: 1, mode: 'publish' });
      } catch (e) {
        toast.error(e?.message || 'Could not load trip.');
      }
      return;
    }
    if (action === 'edit-published-content') {
      try {
        const full = await fetchItineraryById(trip.id);
        setPublishTarget({ itinerary: full, initialStep: 1, mode: 'edit' });
      } catch (e) {
        toast.error(e?.message || 'Could not load trip.');
      }
      return;
    }
    if (action === 'set-cover-page') {
      try {
        const full = await fetchItineraryById(trip.id);
        setCoverImageTarget(full);
      } catch (e) {
        toast.error(e?.message || 'Could not load trip.');
      }
      return;
    }
    if (action === 'rename') {
      setRenameTarget(trip);
      setRenameTitleDraft(String(trip.title || '').trim() || 'Untitled trip');
      return;
    }
    if (action === 'duplicate') {
      try {
        await duplicateItinerary(trip.id);
        await refreshProfile();
        toast.success('Trip duplicated successfully');
      } catch (e) {
        toast.error(e?.message || 'Could not duplicate trip.');
      }
      return;
    }
    if (action === 'delete') {
      setDialog({
        ...DIALOG_CLOSED,
        open: true,
        title: 'Delete trip',
        message: 'Delete this trip? This cannot be undone.',
        showCancel: true,
        confirmText: 'Delete',
        onConfirm: async () => {
          try {
            await deleteItinerary(trip.id);
            await refreshProfile();
            setDialog(DIALOG_CLOSED);
            toast.success('Trip deleted');
          } catch (e) {
            setDialog({
              ...DIALOG_CLOSED,
              open: true,
              title: 'Delete failed',
              message: e?.message || 'Please try again.',
            });
          }
        },
      });
    }
  };


  useEffect(() => {
    const handler = (e) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setDestinationCountryOpen(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
        setDestinationCityOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const removeFriendFromList = async (friendId) => {
    if (!friendId) return;
    try {
      await removeFriend(friendId);
      await refreshProfile();
    } catch (err) {
      setErrorMsg(err?.message || 'Could not remove friend.');
    }
  };


  const closeShareTrip = () => {
    setShareOpen(false);
    setShareTrip(null);
  };

  const openShareTrip = async (trip) => {
    const tripId = String(trip?.id || trip?._id || '').trim();
    if (!tripId) {
      toast.error('Trip link is unavailable for this item.');
      return;
    }
    setShareOpen(true);
    setShareLoading(true);
    try {
      const full = await fetchItineraryById(tripId);
      setShareTrip(full || trip);
    } catch (err) {
      setShareTrip(trip);
      toast.error(err?.message || 'Could not load trip details.');
    } finally {
      setShareLoading(false);
    }
  };

  const handleShareSendToFriends = async (friendIds, roleMap = {}) => {
    const shareTripId = String(shareTrip?.id || shareTrip?._id || '').trim();
    if (!shareTripId) return;
    try {
      const currentCollabs = Array.isArray(shareTrip?.collaborators) ? shareTrip.collaborators : [];
      const existingIds = new Set(
        currentCollabs.map((c) => String(c?.user?.id || c?.userId || '')).filter(Boolean)
      );
      const toAdd = friendIds.filter((id) => !existingIds.has(String(id)));
      const newCollabs = [
        ...currentCollabs.map((c) => ({
          userId: String(c?.user?.id || c?.userId || ''),
          email: c?.email || '',
          role: c?.role || 'editor',
        })),
        ...toAdd.map((id) => ({ userId: String(id), role: roleMap[id] || 'viewer' })),
      ];
      const updated = await updateItinerary(shareTripId, { collaborators: newCollabs });
      setShareTrip(updated || shareTrip);
      await shareItineraryWithFriends(shareTripId, toAdd);
      toast.success(`Trip shared with ${toAdd.length} friend${toAdd.length !== 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(err?.message || 'Could not share trip.');
    }
  };

  const handleShareInviteByEmail = async (email, role = 'viewer') => {
    const shareTripId = String(shareTrip?.id || shareTrip?._id || '').trim();
    if (!shareTripId) return;
    try {
      const lookup = await lookupUserByEmail(email);
      const userMatch = lookup?.user || null;
      const userId = userMatch?.id ? String(userMatch.id) : '';
      if (!userId) throw new Error('No account found for that email.');
      const currentCollabs = Array.isArray(shareTrip?.collaborators) ? shareTrip.collaborators : [];
      const exists = currentCollabs.some((c) => {
        const cId = String(c?.user?.id || c?.userId || '');
        return cId && cId === userId;
      });
      if (exists) {
        toast('This traveler already has access.');
        return;
      }
      const newCollabs = [
        ...currentCollabs.map((c) => ({
          userId: String(c?.user?.id || c?.userId || ''),
          email: c?.email || '',
          role: c?.role || 'editor',
        })),
        { userId, email, role },
      ];
      const updated = await updateItinerary(shareTripId, { collaborators: newCollabs });
      setShareTrip(updated || shareTrip);
      await shareItineraryWithFriends(shareTripId, [userId]);
      toast.success('Invite sent.');
    } catch (err) {
      toast.error(err?.message || 'Could not send invite.');
    }
  };

  const handleShareInviteByUser = async (searchUser, role = 'viewer') => {
    const shareTripId = String(shareTrip?.id || shareTrip?._id || '').trim();
    if (!shareTripId) return;
    const userId = String(searchUser?.id || '');
    if (!userId) throw new Error('Invalid user.');
    const currentCollabs = Array.isArray(shareTrip?.collaborators) ? shareTrip.collaborators : [];
    const exists = currentCollabs.some((c) => String(c?.user?.id || c?.userId || '') === userId);
    if (exists) { toast('This person already has access.'); return; }
    const newCollabs = [
      ...currentCollabs.map((c) => ({ userId: String(c?.user?.id || c?.userId || ''), role: c?.role || 'viewer' })),
      { userId, role },
    ];
    const updated = await updateItinerary(shareTripId, { collaborators: newCollabs });
    setShareTrip(updated || shareTrip);
    await shareItineraryWithFriends(shareTripId, [userId]);
    toast.success('Invite sent.');
  };

  const handleUpdateShareCollaborator = async (collab, newRole) => {
    const shareTripId = String(shareTrip?.id || shareTrip?._id || '').trim();
    if (!shareTripId) return;
    try {
      const collabId = String(collab?.user?.id || collab?.userId || '');
      const currentCollabs = Array.isArray(shareTrip?.collaborators) ? shareTrip.collaborators : [];
      const updated = await updateItinerary(shareTripId, {
        collaborators: currentCollabs.map((c) => {
          const cId = String(c?.user?.id || c?.userId || '');
          const matchById = collabId && cId === collabId;
          const matchByEmail = collab?.email && c.email === collab.email;
          const payload = { role: matchById || matchByEmail ? newRole : (c?.role || 'editor') };
          if (cId) payload.userId = cId;
          if (c?.email) payload.email = c.email;
          return payload;
        }),
      });
      setShareTrip(updated || shareTrip);
    } catch (err) {
      toast.error(err?.message || 'Could not update access.');
    }
  };

  const handleRemoveShareCollaborator = async (collab) => {
    const shareTripId = String(shareTrip?.id || shareTrip?._id || '').trim();
    if (!shareTripId) return;
    try {
      const collabId = String(collab?.user?.id || collab?.userId || '');
      const currentCollabs = Array.isArray(shareTrip?.collaborators) ? shareTrip.collaborators : [];
      const updated = await updateItinerary(shareTripId, {
        collaborators: currentCollabs
          .filter((c) => {
            const cId = String(c?.user?.id || c?.userId || '');
            const matchById = collabId && cId === collabId;
            const matchByEmail = collab?.email && c.email === collab.email;
            return !matchById && !matchByEmail;
          })
          .map((c) => {
            const cId = String(c?.user?.id || c?.userId || '');
            const payload = { role: c?.role || 'editor' };
            if (cId) payload.userId = cId;
            if (c?.email) payload.email = c.email;
            return payload;
          }),
      });
      setShareTrip(updated || shareTrip);
    } catch (err) {
      toast.error(err?.message || 'Could not remove collaborator.');
    }
  };

  const handleCopyShareLink = async () => {
    const shareTripId = String(shareTrip?.id || shareTrip?._id || '').trim();
    if (!shareTripId) return;
    const shareLink = `${window.location.origin}/trip/${encodeURIComponent(shareTripId)}`;
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

      intro: profile?.intro || '',
      interests: Array.isArray(profile?.interests) ? profile.interests : [],
      nationality: profile?.nationality || '',
      socials: normalizeSocials(profile?.socials),
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setSocialDraft({ platform: '', value: '' });
    setEditOpen(true);
  };

  const saveProfile = async () => {
    if (editSaving) return;
    setEditError('');
    setEditSaving(true);
    try {
      let uploadedProfile = {};
      if (photoFile) {
        setPhotoUploading(true);
        const uploadRes = await uploadProfilePhoto(photoFile);
        uploadedProfile = uploadRes?.profile || {};
        setProfileData((prev) => ({ ...prev, ...uploadedProfile }));
      }
      const payload = {
        name: editDraft.name.trim(),

        intro: editDraft.intro.trim(),
        interests: editDraft.interests.filter(Boolean),
        nationality: editDraft.nationality.trim(),
        socials: Array.isArray(editDraft.socials)
          ? editDraft.socials.map(({ platform, url, handle }) => ({ platform, url, handle }))
          : [],
      };
      const res = await updateMyProfile(payload);
      const nextProfile = res?.profile || payload;
      const mergedProfile = { ...(profileData || user || {}), ...uploadedProfile, ...nextProfile };
      setProfileData(mergedProfile);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      setPhotoFile(null);
      setEditOpen(false);
      if (onUserUpdate) {
        onUserUpdate({
          ...user,
          ...mergedProfile,
        });
      }
    } catch (err) {
      setEditError(err?.message || 'Could not update profile.');
    } finally {
      setPhotoUploading(false);
      setEditSaving(false);
    }
  };

  const removeProfilePhoto = async () => {
    if (photoUploading) return;
    setEditError('');
    setPhotoUploading(true);
    try {
      const res = await deleteProfilePhoto();
      const nextProfile = res?.profile || { picture: '' };
      setProfileData((prev) => ({ ...(prev || {}), ...nextProfile }));
      if (onUserUpdate) {
        onUserUpdate({
          ...user,
          ...nextProfile,
        });
      }
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      setPhotoFile(null);
    } catch (err) {
      setEditError(err?.message || 'Could not remove photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    profile,
    profileData,
    displayName,
    picture,
    interestsList,
    socialsList,
    stats,
    trips,
    tripStatuses,
    openStatusDropdownId,
    setOpenStatusDropdownId,
    statusDropdownRef,
    openOwnerMenuId,
    setOpenOwnerMenuId,
    ownerMenuRef,
    publishTarget,
    setPublishTarget,
    coverImageTarget,
    setCoverImageTarget,
    renameTarget,
    setRenameTarget,
    renameTitleDraft,
    setRenameTitleDraft,
    dialog,
    friendsList,
    mapDestinations,
    isFriend,
    friendLoading,
    requestStatus,
    viewerRequestId,
    requests,
    requestsLoading,
    outgoingRequests,
    outgoingLoading,
    addFriendOpen,
    setAddFriendOpen,
    addFriendValue,
    setAddFriendValue,
    addFriendError,
    setAddFriendError,
    addFriendLoading,
    addFriendResults,
    setAddFriendResults,
    addFriendSelectedId,
    setAddFriendSelectedId,
    addFriendSearching,
    loading,
    errorMsg,
    setErrorMsg,
    geoData,
    geoLoading,
    geoError,
    addDestinationOpen,
    setAddDestinationOpen,
    destinationCountry,
    setDestinationCountry,
    destinationCountryInput,
    setDestinationCountryInput,
    destinationCountryOpen,
    setDestinationCountryOpen,
    destinationCity,
    setDestinationCity,
    destinationCityOpen,
    setDestinationCityOpen,
    destinationCountrySuggestions,
    destinationCitySuggestions,
    destinationSuggestionsLoading,
    destinationError,
    setDestinationError,
    destinationLoading,
    countryDropdownRef,
    cityDropdownRef,
    editOpen,
    setEditOpen,
    editDraft,
    setEditDraft,
    editError,
    editSaving,
    photoFile,
    setPhotoFile,
    photoPreview,
    setPhotoPreview,
    photoUploading,
    socialDraft,
    setSocialDraft,
    statsListOpen,
    setStatsListOpen,
    shareOpen,
    shareTrip,
    shareLoading,
    isSelf,
    countries,
    countriesCount,
    citiesCount,
    visitedCountries,
    visitedCities,
    mapFlags,
    flagForCountry,
    openEdit,
    acceptRequest,
    declineRequest,
    handleFriendToggle,
    handleShare,
    profileShareOpen,
    setProfileShareOpen,
    profileShareSelectedIds,
    profileShareSending,
    handleProfileShareInviteByEmail,
    handleProfileShareInviteByUser,
    handleProfileShareToggleFriend,
    handleProfileShareSend,
    handleProfileShareCopyLink,
    getTripLink,
    refreshProfile,
    refreshRequests,
    removeFriendFromList,
    submitAddFriend,
    submitDestination,
    setTripStatus,
    handleItineraryOwnerMenu,
    applyRenameFromModal,
    closeShareTrip,
    handleShareSendToFriends,
    handleShareInviteByEmail,
    handleShareInviteByUser,
    handleUpdateShareCollaborator,
    handleRemoveShareCollaborator,
    handleCopyShareLink,
    commitSocialDraft,
    saveProfile,
    removeProfilePhoto,
    closeDialog,
  };
}

import express from 'express';
import multer from 'multer';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
});

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
/** Google AI Studio / Gemini API key — used first for social import when set; OpenAI is fallback. */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GOOGLE_PLACES_TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const headers = {
  'User-Agent': 'WhereToGoNext/1.0 (travel-planner; social-import)',
  Accept: 'application/json',
};

/** TikTok's oEmbed often returns 400 for share/short URLs until resolved to /@handle/video/{id}. */
const BROWSER_FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

function isTikTokCanonicalVideoOrPhotoUrl(u) {
  return /tiktok\.com\/@[^/]+\/(video|photo)\/\d+/i.test(String(u || ''));
}

function needsTikTokRedirectResolution(urlStr) {
  try {
    const u = new URL(String(urlStr).trim());
    const host = u.hostname.toLowerCase();
    if (host === 'vm.tiktok.com' || host === 'vt.tiktok.com') return true;
    if (host.endsWith('tiktok.com') && /^\/t\//i.test(u.pathname)) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Follow HTTP redirects (HEAD) so vm.tiktok.com / tiktok.com/t/... become canonical video URLs.
 */
async function resolveTikTokUrlForOembed(urlStr) {
  const trimmed = String(urlStr || '').trim().split('#')[0];
  if (!trimmed) return trimmed;
  if (isTikTokCanonicalVideoOrPhotoUrl(trimmed)) return trimmed;
  if (!trimmed.toLowerCase().includes('tiktok.com')) return trimmed;
  if (!needsTikTokRedirectResolution(trimmed)) return trimmed;

  let current = trimmed;
  for (let hop = 0; hop < 12; hop += 1) {
    try {
      const res = await fetch(current, {
        method: 'HEAD',
        redirect: 'manual',
        headers: BROWSER_FETCH_HEADERS,
        signal: AbortSignal.timeout(12000),
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) break;
        current = new URL(loc, current).href;
        if (isTikTokCanonicalVideoOrPhotoUrl(current)) return current.split('#')[0];
        continue;
      }
      if (res.status === 200) {
        const finalUrl = res.url || current;
        if (isTikTokCanonicalVideoOrPhotoUrl(finalUrl)) return finalUrl.split('#')[0];
        break;
      }
      break;
    } catch {
      break;
    }
  }
  return trimmed;
}

function oembedHtmlToPlainText(html) {
  if (!html) return '';
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function apiOrigin() {
  return process.env.API_PUBLIC_ORIGIN || `http://localhost:${process.env.PORT || 5000}`;
}

function photoUrlFromReference(ref) {
  if (!ref) return '';
  return `${apiOrigin()}/api/discovery/photo?reference=${encodeURIComponent(ref)}&maxwidth=800`;
}

async function geocodeDestination(destination) {
  const query = new URLSearchParams({
    q: destination,
    format: 'jsonv2',
    limit: '1',
  });
  const res = await fetch(`${NOMINATIM_URL}?${query}`, { headers });
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No location found for ${destination}`);
  }
  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}

async function fetchDiscoveryPayload(destination, limit = 80) {
  const port = process.env.PORT || 5000;
  const host = process.env.INTERNAL_API_HOST || '127.0.0.1';
  const url = `http://${host}:${port}/api/discovery/destination?${new URLSearchParams({
    destination,
    limit: String(limit),
  })}`;
  const res = await fetch(url, { headers: { 'User-Agent': headers['User-Agent'] } });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Discovery failed: ${res.status}`);
  }
  return res.json();
}

async function fetchNoembed(url) {
  try {
    const u = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const res = await fetch(u, { headers, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchTiktokOembed(url) {
  const tryOnce = async (embedUrl) => {
    const u = `https://www.tiktok.com/oembed?url=${encodeURIComponent(embedUrl)}`;
    const res = await fetch(u, {
      headers: { ...headers, ...BROWSER_FETCH_HEADERS, Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    return res.json();
  };
  try {
    const resolved = await resolveTikTokUrlForOembed(url);
    let raw = await tryOnce(resolved);
    if (!raw && resolved !== url) {
      raw = await tryOnce(url);
    }
    return raw;
  } catch {
    return null;
  }
}

async function fetchYoutubeOembed(url) {
  try {
    const u = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(u, { headers, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchPinterestOembed(url) {
  try {
    const u = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}`;
    const res = await fetch(u, { headers, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchInstagramOembed(url) {
  try {
    const u = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`;
    const res = await fetch(u, { headers, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function collectLinkMetadata(url) {
  if (!url || !/^https?:\/\//i.test(url)) return { text: '', provider: '' };
  const lower = url.toLowerCase();
  let raw = null;
  if (lower.includes('tiktok.com')) raw = await fetchTiktokOembed(url);
  else if (lower.includes('youtube.com') || lower.includes('youtu.be')) raw = await fetchYoutubeOembed(url);
  else if (lower.includes('pinterest.')) raw = await fetchPinterestOembed(url);
  else if (lower.includes('instagram.com')) raw = await fetchInstagramOembed(url);

  if (!raw) raw = await fetchNoembed(url);

  const title = String(raw?.title || raw?.html_title || '').trim();
  const author = String(raw?.author_name || '').trim();
  const provider = String(raw?.provider_name || '').trim();
  const desc = String(raw?.description || '').replace(/<[^>]+>/g, ' ').trim();
  const htmlFromEmbed = oembedHtmlToPlainText(raw?.html);

  const parts = [title, author, desc, htmlFromEmbed].filter(Boolean);
  return {
    text: parts.join(' \n '),
    provider,
  };
}

const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'my', 'our', 'your',
  'day', 'trip', 'travel', 'visit', 'vlog', 'video', 'reel', 'tiktok', 'instagram', 'youtube', 'pinterest',
  'best', 'top', 'things', 'must', 'see', 'food', 'eat', 'guide', 'part', 'ep', 'full',
]);

function extractKeywordCandidates(rawText) {
  const text = String(rawText || '');
  const out = new Set();

  const hashtagMatches = text.match(/#[\p{L}\d_]+/gu) || [];
  hashtagMatches.forEach((h) => {
    const w = h.slice(1).replace(/_/g, ' ').trim();
    if (w.length >= 2) out.add(w);
  });

  const segments = text.split(/[\n|•·–—\-/]+/).map((s) => s.trim()).filter(Boolean);
  segments.forEach((seg) => out.add(seg));

  const words = text
    .replace(/[#@]/g, ' ')
    .split(/[\s,;]+/)
    .map((w) => w.replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu, ''))
    .filter((w) => w.length >= 3 && !STOP.has(w.toLowerCase()));

  for (let i = 0; i < words.length - 1; i += 1) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (bigram.length <= 60) out.add(bigram);
  }

  words.forEach((w) => {
    if (w.length >= 4) out.add(w);
  });

  return [...out].filter((s) => s.length >= 2 && s.length <= 120);
}

function normalizeForCompare(s) {
  return String(s || '').split(',')[0].trim().toLowerCase().replace(/\s+/g, ' ');
}

function isDifferentLocation(tripDest, candidate) {
  const a = normalizeForCompare(tripDest);
  const b = normalizeForCompare(candidate);
  if (!b) return false;
  if (a === b) return false;
  if (a.includes(b) || b.includes(a)) return false;
  return true;
}

function parseSocialSignalsJson(rawText) {
  const raw = String(rawText || '');
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { places: [], inferredLocations: [] };
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const places = Array.isArray(parsed.places)
      ? parsed.places.map((s) => String(s).trim()).filter((s) => s.length >= 2 && s.length <= 120)
      : [];
    const inferredLocations = Array.isArray(parsed.inferredLocations)
      ? parsed.inferredLocations.map((s) => String(s).trim()).filter((s) => s.length >= 2 && s.length <= 120)
      : [];
    return { places, inferredLocations };
  } catch {
    return { places: [], inferredLocations: [] };
  }
}

/**
 * Gemini (multimodal). Throws on HTTP/network errors so caller can fall back to OpenAI.
 */
async function geminiExtractSocialSignals({ buffers, mimeTypes, linkText, tripDestination }) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  const hasImages = Array.isArray(buffers) && buffers.length > 0;
  const caption = String(linkText || '').trim();
  if (!hasImages && caption.length < 3) {
    return { places: [], inferredLocations: [] };
  }

  const instruction = `The traveler's trip is currently set to: "${tripDestination}".

Analyze this social post (caption/metadata${hasImages ? ' and screenshot image(s)' : ''}).

1) "places": specific venues — landmarks, museums, restaurants, cafés, parks, hotels, neighborhoods, or readable signage.
2) "inferredLocations": city or region names where this content was filmed, photographed, or is clearly about. If it is about a different place than the trip city (e.g. trip is Vancouver but the content shows Calgary), include that city (e.g. "Calgary" or "Calgary, Canada"). If content only matches the trip destination, use an empty array or only that city.

Return ONLY valid JSON: {"places":["..."],"inferredLocations":["..."]}`;

  const parts = [{ text: instruction }];
  if (caption) {
    parts.push({ text: `Caption / metadata:\n${caption.slice(0, 8000)}` });
  }

  const maxImages = Math.min(4, buffers?.length || 0);
  for (let i = 0; i < maxImages; i += 1) {
    const mime = mimeTypes[i] && /^image\//i.test(mimeTypes[i]) ? mimeTypes[i] : 'image/jpeg';
    const b64 = buffers[i].toString('base64');
    parts.push({
      inline_data: {
        mime_type: mime,
        data: b64,
      },
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.2,
      },
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!res.ok) {
    const err = await res.text();
    const errMsg = `Gemini ${res.status}: ${err.slice(0, 400)}`;
    console.warn('[social-import]', errMsg);
    throw new Error(errMsg);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const blockReason = candidate?.blockReason || data?.promptFeedback?.blockReason;
  if (blockReason) {
    console.warn('[social-import] Gemini blocked:', blockReason);
    throw new Error(`Gemini blocked: ${blockReason}`);
  }

  const textOut = Array.isArray(candidate?.content?.parts)
    ? candidate.content.parts.map((p) => p.text || '').join('')
    : '';
  return parseSocialSignalsJson(textOut);
}

async function extractSocialSignalsWithFallback({ buffers, mimeTypes, linkText, tripDestination }) {
  const hasGemini = Boolean(GEMINI_API_KEY);
  const hasOpenAI = Boolean(OPENAI_API_KEY);

  if (hasGemini) {
    try {
      const result = await geminiExtractSocialSignals({
        buffers,
        mimeTypes,
        linkText,
        tripDestination,
      });
      return { ...result, llmProvider: 'gemini' };
    } catch (e) {
      console.warn('[social-import] Gemini failed:', e?.message || e);
      if (hasOpenAI) {
        const result = await openaiExtractSocialSignals({
          buffers,
          mimeTypes,
          linkText,
          tripDestination,
        });
        return { ...result, llmProvider: 'openai-fallback' };
      }
      return { places: [], inferredLocations: [], llmProvider: 'gemini-error' };
    }
  }

  if (hasOpenAI) {
    const result = await openaiExtractSocialSignals({
      buffers,
      mimeTypes,
      linkText,
      tripDestination,
    });
    return { ...result, llmProvider: 'openai' };
  }

  return { places: [], inferredLocations: [], llmProvider: 'none' };
}

/** Pick first inferred city/region that differs from the trip and geocodes successfully. */
async function pickAlternateDestinationLabel(inferredLocations, tripDestination) {
  const seen = new Set();
  for (const raw of inferredLocations || []) {
    const loc = String(raw).trim();
    if (!loc || seen.has(loc.toLowerCase())) continue;
    seen.add(loc.toLowerCase());
    if (!isDifferentLocation(tripDestination, loc)) continue;
    const primary = loc.split(',')[0].trim();
    try {
      await geocodeDestination(primary);
      return primary;
    } catch {
      try {
        await geocodeDestination(loc);
        return primary;
      } catch {
        /* try next */
      }
    }
  }
  return null;
}

/**
 * Vision + caption: venue names and geographic focus (e.g. Calgary vs Vancouver trip).
 */
async function openaiExtractSocialSignals({ buffers, mimeTypes, linkText, tripDestination }) {
  if (!OPENAI_API_KEY) return { places: [], inferredLocations: [] };
  const hasImages = Array.isArray(buffers) && buffers.length > 0;
  const caption = String(linkText || '').trim();
  if (!hasImages && caption.length < 3) return { places: [], inferredLocations: [] };

  const content = [
    {
      type: 'text',
      text: `The traveler's trip is currently set to: "${tripDestination}".

Analyze this social post (caption/metadata${hasImages ? ' and screenshot image(s)' : ''}).

1) "places": specific venues — landmarks, museums, restaurants, cafés, parks, hotels, neighborhoods, or readable signage.
2) "inferredLocations": city or region names where this content was filmed, photographed, or is clearly about. If it is about a different place than the trip city (e.g. trip is Vancouver but the content shows Calgary), include that city (e.g. "Calgary" or "Calgary, Canada"). If content only matches the trip destination, use an empty array or only that city.

Return ONLY valid JSON: {"places":["..."],"inferredLocations":["..."]}`,
    },
  ];

  if (caption) {
    content.push({ type: 'text', text: `Caption / metadata:\n${caption.slice(0, 8000)}` });
  }

  const maxImages = Math.min(4, buffers?.length || 0);
  for (let i = 0; i < maxImages; i += 1) {
    const mime = mimeTypes[i] && /^image\//i.test(mimeTypes[i]) ? mimeTypes[i] : 'image/jpeg';
    const b64 = buffers[i].toString('base64');
    content.push({
      type: 'image_url',
      image_url: { url: `data:${mime};base64,${b64}` },
    });
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1000,
      messages: [{ role: 'user', content }],
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn('[social-import] OpenAI error:', res.status, err);
    return { places: [], inferredLocations: [] };
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || '';
  return parseSocialSignalsJson(raw);
}

function dedupePlaceRows(list) {
  const seen = new Set();
  const out = [];
  for (const p of list) {
    const key = p.googlePlaceId || p.id
      || `${String(p.name || '').toLowerCase()}|${Math.round((p.lat || 0) * 500)}|${Math.round((p.lng || 0) * 500)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

async function buildRankedPlacesForLabel(destLabel, searchQueries) {
  const center = await geocodeDestination(destLabel);
  const discoveryPayload = await fetchDiscoveryPayload(destLabel, 80);
  const pool = Array.isArray(discoveryPayload.places) ? discoveryPayload.places : [];
  const textSearchPlaces = await googleTextSearchQueries(
    searchQueries,
    destLabel,
    center.lat,
    center.lng,
  );
  return mergeAndRankPlaces({
    discoveryPlaces: pool,
    textSearchPlaces,
    keywords: searchQueries,
    destination: destLabel,
  });
}

function scorePlaceAgainstKeywords(place, keywords) {
  const hay = `${place.name || ''} ${place.address || ''} ${place.description || ''} ${place.overview || ''}`.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    const k = kw.toLowerCase().trim();
    if (k.length < 2) continue;
    if (hay.includes(k)) score += Math.min(80, 5 + k.length * 2);
    const parts = k.split(/\s+/).filter((p) => p.length >= 3);
    for (const p of parts) {
      if (hay.includes(p)) score += 4;
    }
  }
  return score;
}

function normalizeGoogleTextSearchResult(place, destination) {
  const loc = place.geometry?.location;
  if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return null;
  const photos = Array.isArray(place.photos) ? place.photos : [];
  const ref = photos[0]?.photo_reference || '';
  return {
    id: `google-ts-${place.place_id}`,
    googlePlaceId: place.place_id,
    name: place.name || '',
    lat: loc.lat,
    lng: loc.lng,
    address: place.formatted_address || place.vicinity || destination,
    rating: Number(place.rating || 0),
    reviewCount: Number(place.user_ratings_total || 0),
    image: photoUrlFromReference(ref),
    description: place.editorial_summary?.overview || `${place.name} near ${destination}`,
    overview: place.editorial_summary?.overview || `${place.name} in ${destination}`,
    recommendedScore: Number(place.rating || 0) * 10 + Math.log10(Number(place.user_ratings_total || 0) + 1) * 4,
  };
}

async function googleTextSearchQueries(queries, destination, centerLat, centerLng) {
  if (!GOOGLE_PLACES_API_KEY || !queries.length) return [];
  const collected = [];
  const seen = new Set();

  for (const q of queries.slice(0, 6)) {
    const query = `${q} ${destination}`.trim();
    const params = new URLSearchParams({
      query,
      key: GOOGLE_PLACES_API_KEY,
    });
    if (Number.isFinite(centerLat) && Number.isFinite(centerLng)) {
      params.set('location', `${centerLat},${centerLng}`);
      params.set('radius', '50000');
    }

    try {
      const res = await fetch(`${GOOGLE_PLACES_TEXT_SEARCH_URL}?${params}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status !== 'OK' || !Array.isArray(data.results)) continue;
      for (const r of data.results) {
        const id = r.place_id;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const norm = normalizeGoogleTextSearchResult(r, destination);
        if (norm) collected.push(norm);
      }
    } catch (e) {
      console.warn('[social-import] text search failed for', query, e?.message);
    }
  }

  return collected;
}

function mergeAndRankPlaces({ discoveryPlaces, textSearchPlaces, keywords, destination }) {
  const merged = [];
  const seen = new Set();

  for (const p of textSearchPlaces) {
    const key = p.googlePlaceId || `${p.name}|${p.lat}|${p.lng}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      ...p,
      _socialScore: 200 + scorePlaceAgainstKeywords(p, keywords),
    });
  }

  for (const p of discoveryPlaces) {
    const key = p.id || p.googlePlaceId || `${p.name}|${p.lat}|${p.lng}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const base = Number(p.recommendedScore || 0) + Number(p.rating || 0) * 3;
    const kw = scorePlaceAgainstKeywords(p, keywords);
    merged.push({
      ...p,
      _socialScore: base + kw,
    });
  }

  merged.sort((a, b) => (b._socialScore || 0) - (a._socialScore || 0));

  return merged.slice(0, 18).map(({ _socialScore, ...rest }) => rest);
}

router.post('/analyze', upload.array('images', 8), async (req, res) => {
  try {
    const destination = String(req.body.destination || '').trim();
    const url = String(req.body.url || '').trim();
    const files = Array.isArray(req.files) ? req.files : [];

    if (!destination) {
      return res.status(400).json({ error: 'destination is required' });
    }

    if (!url && files.length === 0) {
      return res.status(400).json({ error: 'Provide a link or at least one image' });
    }

    let linkText = '';
    let provider = '';
    if (url) {
      const meta = await collectLinkMetadata(url);
      linkText = meta.text;
      provider = meta.provider;
    }

    const mimeTypes = files.map((f) => f.mimetype || 'image/jpeg');
    const buffers = files.map((f) => f.buffer);

    let visionPlaces = [];
    let inferredLocations = [];
    let skippedImageAnalysis = false;
    let llmProvider = 'none';

    const hasLlm = Boolean(GEMINI_API_KEY || OPENAI_API_KEY);
    if (hasLlm && (buffers.length > 0 || linkText.trim().length > 5)) {
      const sig = await extractSocialSignalsWithFallback({
        buffers,
        mimeTypes,
        linkText,
        tripDestination: destination,
      });
      visionPlaces = sig.places;
      inferredLocations = sig.inferredLocations;
      llmProvider = sig.llmProvider || 'none';
    } else if (buffers.length > 0) {
      if (!url) {
        return res.status(422).json({
          error: 'Image analysis requires GEMINI_API_KEY or OPENAI_API_KEY on the server. Add one to your backend .env, or paste a social link together with screenshots.',
          code: 'LLM_REQUIRED',
        });
      }
      skippedImageAnalysis = true;
    }

    const combinedText = [linkText, visionPlaces.join(' ')].filter(Boolean).join(' \n ');
    const keywordList = extractKeywordCandidates(combinedText);
    const searchQueries = [...new Set([...visionPlaces, ...keywordList])].slice(0, 12);

    try {
      await geocodeDestination(destination);
    } catch (e) {
      return res.status(400).json({ error: e.message || 'Invalid destination' });
    }

    const alternateLabel = await pickAlternateDestinationLabel(inferredLocations, destination);

    let places = [];
    let locationInsight = { mismatch: false };

    if (alternateLabel) {
      try {
        const rankedDetected = await buildRankedPlacesForLabel(alternateLabel, searchQueries);
        const rankedTrip = await buildRankedPlacesForLabel(destination, searchQueries);
        places = dedupePlaceRows([...rankedDetected, ...rankedTrip]).slice(0, 20);
        locationInsight = {
          mismatch: true,
          tripDestination: destination,
          detectedLabel: alternateLabel,
          inferredLocations,
          message:
            `This post looks like it’s about ${alternateLabel}, not ${destination}. `
            + `Suggestions below lead with places in ${alternateLabel}, then your trip city. `
            + `You can add ${alternateLabel} to your trip destinations if you’re visiting both.`,
        };
      } catch (e) {
        console.warn('[social-import] dual-region merge failed, falling back to trip only:', e?.message);
        places = await buildRankedPlacesForLabel(destination, searchQueries);
      }
    } else {
      places = await buildRankedPlacesForLabel(destination, searchQueries);
    }

    if (places.length === 0) {
      let emptyWarning = 'No matching places found. Try a different link or clearer screenshots.';
      if (url && /tiktok\.com/i.test(url) && !linkText.trim()) {
        emptyWarning =
          'TikTok did not return a caption for this link. Open the video in a browser and copy the full URL from the address bar (Share → Copy link). Short links must open the real video; TikTok photo posts usually need screenshots plus an LLM key on the server.';
      }
      return res.json({
        places: [],
        hints: searchQueries,
        linkPreviewText: linkText.slice(0, 500),
        visionPlaces,
        inferredLocations,
        locationInsight,
        llmProvider,
        warning: emptyWarning,
      });
    }

    return res.json({
      places,
      hints: searchQueries.slice(0, 20),
      linkPreviewText: linkText.slice(0, 500),
      visionPlaces,
      inferredLocations,
      provider,
      locationInsight,
      llmProvider,
      usedGoogleTextSearch: Boolean(GOOGLE_PLACES_API_KEY && searchQueries.length),
      skippedImageAnalysis,
      warning: skippedImageAnalysis
        ? 'Screenshots were not analyzed (set GEMINI_API_KEY or OPENAI_API_KEY for vision). Recommendations use your link and destination only.'
        : undefined,
    });
  } catch (error) {
    console.error('[social-import] analyze error:', error);
    return res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

export default router;

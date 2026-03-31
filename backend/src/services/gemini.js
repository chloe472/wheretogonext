import fs from 'fs/promises';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

/**
 * Tried after GEMINI_MODEL on 404 / errors.
 * Use IDs from https://ai.google.dev/gemini-api/docs/models — short names like
 * `gemini-1.5-flash` often 404 on generativelanguage.googleapis.com; prefer -002 / -8b / lite.
 */
const GEMINI_MODEL_FALLBACKS = [
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash-8b',
];

/**
 * POST generateContent; tries GEMINI_MODEL then fallbacks. Handles top-level data.error and empty candidates.
 */
async function geminiGenerateContent(body, timeoutMs = 90000) {
  const models = [GEMINI_MODEL, ...GEMINI_MODEL_FALLBACKS].filter(
    (m, i, a) => m && a.indexOf(m) === i,
  );
  let lastIssue = 'Gemini: no valid response';
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      lastIssue = e?.message || 'Gemini request failed';
      console.warn(`[gemini] fetch failed (${model}):`, lastIssue);
      continue;
    }
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.warn('[gemini] non-JSON', model, res.status, raw.slice(0, 150));
      if (res.status === 404) continue;
      lastIssue = `Gemini ${res.status}: ${raw.slice(0, 200)}`;
      continue;
    }
    if (!res.ok) {
      const msg = data?.error?.message || raw.slice(0, 200);
      console.warn(`[gemini] HTTP ${res.status} (${model}):`, msg);
      if (res.status === 404) continue;
      lastIssue = msg;
      continue;
    }
    if (data.error) {
      console.warn('[gemini] data.error', model, data.error);
      lastIssue = data.error.message || 'Gemini API error';
      continue;
    }
    const candidate = data?.candidates?.[0];
    if (!candidate) {
      console.warn('[gemini] empty candidates', model, data?.promptFeedback);
      lastIssue = 'No candidates (check API key / billing / safety)';
      continue;
    }
    const blockReason = candidate?.blockReason || data?.promptFeedback?.blockReason;
    if (blockReason) {
      console.warn('[gemini] blocked', model, blockReason);
      lastIssue = `Blocked: ${blockReason}`;
      continue;
    }
    const textOut = Array.isArray(candidate?.content?.parts)
      ? candidate.content.parts.map((p) => p.text || '').join('')
      : '';
    if (!textOut.trim()) {
      console.warn('[gemini] empty textOut', model, 'finishReason:', candidate?.finishReason);
      lastIssue = `No text output (finishReason: ${candidate?.finishReason || 'unknown'})`;
      continue;
    }
    return { data, candidate, textOut, model };
  }
  return { error: lastIssue };
}

function extToMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function emptyResult(hasError, message = '') {
  return {
    location_name: '',
    latitude: null,
    longitude: null,
    confidence: 'low',
    address: '',
    city: '',
    country: '',
    has_error: hasError,
    error_message: message || undefined,
    google_maps_url: '',
    street_view_url: '',
  };
}

function stripCodeFences(text) {
  return String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/g, '')
    .trim();
}

function parseLocationJson(text) {
  const raw = stripCodeFences(text);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

function mapsUrls(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { google_maps_url: '', street_view_url: '' };
  }
  const q = `${lat},${lng}`;
  return {
    google_maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
    street_view_url: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`,
  };
}

/**
 * Vision analysis for a single screenshot file on disk.
 * @param {string} imagePath - Absolute path to an image file
 * @returns {Promise<{
 *   location_name: string,
 *   latitude: number|null,
 *   longitude: number|null,
 *   confidence: string,
 *   address: string,
 *   city: string,
 *   country: string,
 *   has_error: boolean,
 *   error_message?: string,
 *   google_maps_url: string,
 *   street_view_url: string,
 * }>}
 */
export async function analyzeScreenshot(imagePath) {
  if (!GEMINI_API_KEY) {
    return emptyResult(true, 'GEMINI_API_KEY not configured');
  }

  let buffer;
  try {
    buffer = await fs.readFile(imagePath);
  } catch (e) {
    return emptyResult(true, e?.message || 'Could not read image file');
  }

  const mime = extToMime(imagePath);
  const b64 = buffer.toString('base64');

  const instruction = `You are analyzing a travel/social screenshot (photo, reel frame, or map).

Identify the PRIMARY real-world place if visible (venue, landmark, neighborhood, or readable address/signage).
Prioritize text that is visibly overlaid on the image: stickers, captions, watermarks, logos, and handwritten or printed labels (e.g. a city or venue name on the image).
If there is NO readable text but the scene clearly matches a famous, nameable location (e.g. a well-known lake, mountain viewpoint, or park), put that specific place name in "location_name" even without GPS — users need a searchable name.
Return ONLY valid JSON with this exact shape (no markdown):
{
  "location_name": "short name of the place or empty string",
  "latitude": number or null,
  "longitude": number or null,
  "confidence": "high" | "medium" | "low",
  "address": "best full address if inferable, else empty string",
  "city": "",
  "country": ""
}

If you cannot estimate coordinates, set latitude and longitude to null but still fill location_name/address if readable.`;

  try {
    const gen = await geminiGenerateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: instruction },
            {
              inline_data: {
                mime_type: mime,
                data: b64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.2,
      },
    });

    if (gen.error) {
      return emptyResult(true, gen.error);
    }

    const { textOut } = gen;
    let parsed = parseLocationJson(textOut);
    if (!parsed && textOut.trim()) {
      try {
        parsed = JSON.parse(stripCodeFences(textOut));
      } catch {
        parsed = null;
      }
    }
    if (!parsed) {
      return emptyResult(true, 'Could not parse model response');
    }

    const lat = parsed.latitude != null ? Number(parsed.latitude) : null;
    const lng = parsed.longitude != null ? Number(parsed.longitude) : null;
    const validLat = Number.isFinite(lat) && lat >= -90 && lat <= 90;
    const validLng = Number.isFinite(lng) && lng >= -180 && lng <= 180;

    const { google_maps_url, street_view_url } = mapsUrls(
      validLat ? lat : NaN,
      validLng ? lng : NaN,
    );

    return {
      location_name: String(parsed.location_name || '').trim(),
      latitude: validLat ? lat : null,
      longitude: validLng ? lng : null,
      confidence: ['high', 'medium', 'low'].includes(String(parsed.confidence).toLowerCase())
        ? String(parsed.confidence).toLowerCase()
        : 'medium',
      address: String(parsed.address || '').trim(),
      city: String(parsed.city || '').trim(),
      country: String(parsed.country || '').trim(),
      has_error: false,
      google_maps_url: validLat && validLng ? google_maps_url : '',
      street_view_url: validLat && validLng ? street_view_url : '',
    };
  } catch (e) {
    return emptyResult(true, e?.message || 'Gemini request failed');
  }
}

function parseLocationNameOnlyJson(text) {
  const raw = stripCodeFences(text);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return '';
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return String(parsed.location_name ?? '').trim();
  } catch {
    return '';
  }
}

/**
 * Second vision pass: when the main JSON has no coords and no name, ask explicitly
 * for a recognizable landmark name (e.g. text-free Moraine Lake photos).
 * Returns "" on failure or if the model cannot name a place.
 */
export async function inferLandmarkNameFromImage(imagePath) {
  if (!GEMINI_API_KEY) return '';

  let buffer;
  try {
    buffer = await fs.readFile(imagePath);
  } catch {
    return '';
  }

  const mime = extToMime(imagePath);
  const b64 = buffer.toString('base64');

  const instruction = `This is a travel or landscape photo. There may be NO visible text or signage.

If you recognize a **specific named real-world place** that someone could search on Google Maps — for example a famous lake, national park, viewpoint, beach, or iconic building — return that name. Include a region or country when it helps disambiguate (e.g. "Moraine Lake, Banff National Park, Canada").

If the image is too generic (could be anywhere) or you are not reasonably sure of a single named place, return an empty location_name.

Return ONLY valid JSON (no markdown, no code fences):
{"location_name":"Moraine Lake, Banff National Park, Canada"}
or
{"location_name":""}`;

  try {
    const gen = await geminiGenerateContent(
      {
        contents: [
          {
            role: 'user',
            parts: [
              { text: instruction },
              {
                inline_data: {
                  mime_type: mime,
                  data: b64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.2,
        },
      },
      60000,
    );

    if (gen.error || !gen.textOut) {
      if (gen.error) console.warn('[gemini] inferLandmarkNameFromImage:', gen.error);
      return '';
    }

    const textOut = gen.textOut;
    let name = parseLocationNameOnlyJson(textOut);
    if (!name && textOut.trim()) {
      try {
        const o = JSON.parse(stripCodeFences(textOut));
        name = String(o?.location_name ?? '').trim();
      } catch {
        name = '';
      }
    }
    return name.length >= 2 && name.length <= 200 ? name : '';
  } catch {
    return '';
  }
}


import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function stripCodeFences(text) {
  return String(text || '').replace(/```json|```/g, '').trim();
}

function safeParseJson(text, fallback = {}) {
  try {
    return JSON.parse(stripCodeFences(text));
  } catch {
    return fallback;
  }
}

function normalizePlaceRow(place) {
  return {
    name: String(place?.name || '').trim(),
    description: String(place?.description || '').trim(),
    location: String(place?.location || '').trim(),
    image: String(place?.image || '').trim(),
  };
}

function primaryCity(label) {
  return String(label || '').split(',')[0].trim();
}

function normalizeCityKey(label) {
  return String(label || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function citiesRoughlyMatch(a, b) {
  const x = normalizeCityKey(a);
  const y = normalizeCityKey(b);
  if (!x || !y) return true;
  if (x === y) return true;
  if (x.length >= 4 && y.length >= 4 && (x.includes(y) || y.includes(x))) return true;
  return false;
}

function parseLocationLabel(label) {
  const parts = String(label || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return { city: '', country: '' };
  if (parts.length === 1) return { city: parts[0], country: '' };
  return {
    city: parts[0],
    country: parts[parts.length - 1],
  };
}

function locationTokensMatch(a, b) {
  const aParts = parseLocationLabel(a);
  const bParts = parseLocationLabel(b);

  if (citiesRoughlyMatch(aParts.city, bParts.city)) return true;
  if (aParts.country && bParts.country && citiesRoughlyMatch(aParts.country, bParts.country)) return true;

  if (aParts.city && bParts.country && citiesRoughlyMatch(aParts.city, bParts.country)) return true;
  if (aParts.country && bParts.city && citiesRoughlyMatch(aParts.country, bParts.city)) return true;

  return false;
}

function parseTripDestinations(rawTripDestinations, fallbackDestination) {
  if (Array.isArray(rawTripDestinations)) {
    return rawTripDestinations.map((s) => String(s || '').trim()).filter(Boolean);
  }
  if (typeof rawTripDestinations === 'string' && rawTripDestinations.trim()) {
    try {
      const parsed = JSON.parse(rawTripDestinations);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s || '').trim()).filter(Boolean);
    } catch {
      return rawTripDestinations.split(';').map((s) => s.trim()).filter(Boolean);
    }
  }
  const fallback = String(fallbackDestination || '').trim();
  return fallback ? [fallback] : [];
}

function computeLocationInsight(detectedPlaces, tripDestinations) {
  const knownTripLabels = (Array.isArray(tripDestinations) ? tripDestinations : [])
    .map((d) => String(d || '').trim())
    .filter(Boolean);

  if (knownTripLabels.length === 0 || !Array.isArray(detectedPlaces) || detectedPlaces.length === 0) return null;

  const mismatches = [];
  for (const p of detectedPlaces) {
    const placeLabel = String(p?.location || '').trim();
    const placeCity = primaryCity(placeLabel);
    if (!placeLabel || !placeCity) continue;
    if (knownTripLabels.some((tripLabel) => locationTokensMatch(tripLabel, placeLabel))) continue;
    mismatches.push(placeCity);
  }

  if (mismatches.length === 0) return null;

  const detectedLabel = mismatches[0];
  const tripDisplay = knownTripLabels.join(', ');
  const plural = mismatches.length > 1;

  return {
    mismatch: true,
    tripDestinations: knownTripLabels,
    detectedLabel,
    canAddDetectedDestination: true,
    message: plural
      ? `These places look like they're in ${detectedLabel}, not ${tripDisplay}. You can still add them to your itinerary below, or add ${detectedLabel} to your trip destinations if you're visiting both.`
      : `This place looks like it's in ${detectedLabel}, not ${tripDisplay}. You can still add it to your itinerary below, or add ${detectedLabel} to your trip destinations if you're visiting both.`,
  };
}

async function enrichPlacesWithPhotos(places) {
  const base = Array.isArray(places) ? places : [];
  return Promise.all(
    base.map(async (place) => {
      const row = normalizePlaceRow(place);
      const photoUrl = await getPlacePhotoUrl(row.name);
      return {
        ...row,
        image: photoUrl || row.image || '',
      };
    }),
  );
}

async function generateAdaptedPlaces(model, theme, detectedPlaces, tripDestination) {
  const destination = String(tripDestination || '').trim();
  if (!destination) return [];

  const detectedLines = (Array.isArray(detectedPlaces) ? detectedPlaces : [])
    .slice(0, 8)
    .map((p, i) => `${i + 1}. ${String(p?.name || '').trim()} | ${String(p?.description || '').trim()} | ${String(p?.location || '').trim()}`)
    .join('\n');

  const result = await model.generateContent({
    contents: [
      {
        parts: [
          {
            text: `You are adapting travel inspiration to a target trip destination.\n\nTarget destination: ${destination}\nTheme: ${String(theme || '').trim()}\nDetected inspiration places:\n${detectedLines || 'None'}\n\nReturn STRICT JSON only:\n{\n  "adaptedPlaces": [\n    {\n      "name": "real place name",\n      "description": "short vibe-based reason",\n      "location": "city, country"\n    }\n  ]\n}\n\nRules:\n- Places MUST be in or very near the target destination.\n- Keep vibe similarity, not exact copy.\n- 5 to 8 places.\n- No markdown, no prose, JSON only.`,
          },
        ],
      },
    ],
  });

  const parsed = safeParseJson(result?.response?.text(), { adaptedPlaces: [] });
  const rows = Array.isArray(parsed?.adaptedPlaces) ? parsed.adaptedPlaces : [];
  return rows.map(normalizePlaceRow).filter((p) => p.name);
}

async function getPlacePhotoUrl(placeName) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const query = String(placeName || '').trim();
  if (!apiKey || !query) return null;

  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const placeId = searchData?.candidates?.[0]?.place_id;
    if (!placeId) return null;

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`;
    const detailsRes = await fetch(detailsUrl);
    if (!detailsRes.ok) return null;
    const detailsData = await detailsRes.json();
    const photoRef = detailsData?.result?.photos?.[0]?.photo_reference;
    if (!photoRef) return null;

    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${encodeURIComponent(photoRef)}&key=${apiKey}`;
  } catch (error) {
    console.warn('Places photo lookup failed for:', query, error?.message || error);
    return null;
  }
}

router.post("/analyze-moodboard", async (req, res) => {
  try {
    const { images, destination, tripDestinations: rawTripDestinations } = req.body;

    const imageList = Array.isArray(images) ? images : [];
    if (imageList.length === 0) {
      return res.status(400).json({ error: 'Provide at least one image' });
    }

    const tripDestination = String(destination || '').trim();
    const tripDestinations = parseTripDestinations(rawTripDestinations, tripDestination);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const parts = imageList.map((img) => {
      const url = img.url || img;

      if (url.startsWith("data:image")) {
        const base64 = url.split(",")[1];
        const mimeType = url.split(";")[0].split(":")[1];

        return {
          inlineData: {
            mimeType: mimeType,
            data: base64
          }
        };
      } else {
        return {
          text: url // Fallback
        };
      }
    });

    const result = await model.generateContent({
      contents: [
        {
          parts: [
            {
              text: `
              Analyze these travel moodboard images.

              Return STRICT JSON:

              {
                "theme": "string",
                "places": [
                  {
                    "name": "place name",
                    "description": "short reason",
                    "location": "city/country"
                  }
                ]
              }
              `
            },
            ...parts
          ]
        }
      ]
    });

    const parsed = safeParseJson(result?.response?.text(), { theme: '', places: [] });
    const detectedPlacesRaw = Array.isArray(parsed?.places) ? parsed.places : [];
    const detectedPlaces = await enrichPlacesWithPhotos(detectedPlacesRaw);
    const locationInsight = computeLocationInsight(detectedPlaces, tripDestinations);

    let adaptedPlaces = [];
    if (locationInsight?.mismatch && tripDestination) {
      try {
        const adaptedRaw = await generateAdaptedPlaces(model, parsed?.theme, detectedPlaces, tripDestination);
        adaptedPlaces = await enrichPlacesWithPhotos(adaptedRaw);
      } catch (adaptErr) {
        console.warn('[moodboard-analysis] adaptation failed:', adaptErr?.message || adaptErr);
        adaptedPlaces = [];
      }
    }

    const fallbackPlaces = adaptedPlaces.length > 0 ? adaptedPlaces : detectedPlaces;

    res.json({
      theme: String(parsed?.theme || '').trim(),
      places: fallbackPlaces,
      detectedPlaces,
      adaptedPlaces,
      locationInsight,
      destination: tripDestination || undefined,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
});

export default router;
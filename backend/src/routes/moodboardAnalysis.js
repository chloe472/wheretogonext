import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    const { images } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const parts = images.map(img => {
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

    const text = result.response.text();
    const cleaned = text.replace(/```json|```/g, '').trim();

    const parsed = JSON.parse(cleaned);

    const places = Array.isArray(parsed?.places) ? parsed.places : [];
    const enrichedPlaces = await Promise.all(
      places.map(async (place) => {
        const photoUrl = await getPlacePhotoUrl(place?.name);
        return {
          ...place,
          image: photoUrl || place?.image || '',
        };
      }),
    );

    parsed.places = enrichedPlaces;

    res.json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
});

export default router;
/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk").default;
const { CloudantV1, IamAuthenticator } = require("@ibm-cloud/cloudant");

const app = express();
const PORT = process.env.PORT || 5000;

/* ─── IBM Cloudant Setup ─── */
const DB_USERS = "trekko-users";
const DB_TRIPS = "trekko-trips";

let cloudant = null;

function initCloudant() {
  const url = process.env.CLOUDANT_URL;
  const apikey = process.env.CLOUDANT_APIKEY;

  if (!url || url.includes("YOUR_INSTANCE") || !apikey || apikey.includes("YOUR_IAM")) {
    console.warn("⚠️  Cloudant credentials not configured — DB features will be disabled.");
    console.warn("   Set CLOUDANT_URL and CLOUDANT_APIKEY in server/.env to enable.");
    return null;
  }

  try {
    const authenticator = new IamAuthenticator({ apikey });
    const client = new CloudantV1({ authenticator });
    client.setServiceUrl(url);
    console.log("✅ IBM Cloudant client initialized.");
    return client;
  } catch (err) {
    console.error("❌ Cloudant init failed:", err.message);
    return null;
  }
}

async function ensureDatabase(client, dbName) {
  try {
    await client.getDatabaseInformation({ db: dbName });
    console.log(`📦 Cloudant DB "${dbName}" exists.`);
  } catch (err) {
    if (err.status === 404) {
      await client.putDatabase({ db: dbName });
      console.log(`📦 Cloudant DB "${dbName}" created.`);
    } else {
      throw err;
    }
  }
}

async function setupCloudant() {
  cloudant = initCloudant();
  if (!cloudant) return;
  try {
    await ensureDatabase(cloudant, DB_USERS);
    await ensureDatabase(cloudant, DB_TRIPS);
    console.log("✅ Cloudant databases ready.\n");
  } catch (err) {
    console.error("❌ Cloudant DB setup error:", err.message);
    cloudant = null;
  }
}

/* ─── Middleware ─── */
const allowedOrigins = [
  "http://localhost:3000",
  "https://trekko-ai.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

/* ─── Health Check ─── */
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Trekko API is running 🚀" });
});

/* ═══════════════════════════════════════════════════════════════
   SYSTEM PROMPT — updated for dual-routing photo architecture
   ═══════════════════════════════════════════════════════════════ */
const SYSTEM_PROMPT = `You are Trekko, an expert world-class travel guide and trip planner AI. Your job is to create detailed, personalized, day-by-day travel itineraries.

RULES:
1. You MUST respond ONLY with valid JSON — no markdown, no code fences, no explanatory text.
2. Use the exact JSON structure provided below.
3. Each day must have exactly 3 activities: one for "Morning", one for "Afternoon", and one for "Evening".
4. Tailor recommendations to the user's budget level and preferred travel vibe.
5. Include real, well-known places, restaurants, landmarks, and experiences.
6. Add vivid, helpful descriptions (2-3 sentences) for each activity.
7. Give each day a creative, relevant theme.
8. For category, use one of: "sightseeing", "food", "adventure", "culture", "nightlife", "romantic", "relaxation", "outdoor", "shopping".
9. For tourUrl, generate a Viator search URL in this format: https://www.viator.com/searchResults/all?text=PLACE+NAME+DESTINATION
10. For every activity you MUST include two extra fields:
    a. "placeType" — classify the activity venue as one of: "hotel", "restaurant", "cafe", "landmark", "monument", "city".
       - Use "hotel" for hotels, resorts, stays, and accommodations.
       - Use "restaurant" for restaurants, diners, and eateries.
       - Use "cafe" for cafés, coffee shops, bakeries, and tea houses.
       - Use "landmark" for famous buildings, bridges, towers, temples, churches, mosques, parks, squares, and tourist attractions.
       - Use "monument" for statues, memorials, historical monuments, and ruins.
       - Use "city" for broad city/neighborhood exploration activities (e.g. "Explore Old Town", "Walk along the waterfront").
    b. "imageSearchKeyword" — a broad, famous geographic landmark, city neighborhood, or scenic feature related to the activity's location.
       - Do NOT use specific restaurant, hotel, or business names as the keyword.
       - The keyword must always be visually descriptive and geographically accurate for the destination.
       - Examples:
         • Activity "Dinner at Solas Blanca" → imageSearchKeyword: "Dubai Jumeirah Beach", placeType: "restaurant"
         • Activity "Check in at Ritz-Carlton" → imageSearchKeyword: "Dubai Marina skyline", placeType: "hotel"
         • Activity "Visit Burj Khalifa" → imageSearchKeyword: "Burj Khalifa", placeType: "landmark"
         • Activity "Explore Bastakiya Quarter" → imageSearchKeyword: "Dubai Al Fahidi Historical", placeType: "city"

REQUIRED JSON STRUCTURE:
{
  "trip": [
    {
      "day": 1,
      "theme": "Arrival & First Impressions",
      "activities": [
        {
          "time": "Morning",
          "place": "Place Name",
          "description": "A vivid 2-3 sentence description of the activity, why it's special, and practical tips.",
          "category": "sightseeing",
          "placeType": "landmark",
          "imageSearchKeyword": "Destination Famous Landmark",
          "tourUrl": "https://www.viator.com/searchResults/all?text=Place+Name+Destination"
        },
        {
          "time": "Afternoon",
          "place": "Place Name",
          "description": "Description here.",
          "category": "food",
          "placeType": "restaurant",
          "imageSearchKeyword": "Destination Neighborhood Name",
          "tourUrl": "https://www.viator.com/searchResults/all?text=Place+Name+Destination"
        },
        {
          "time": "Evening",
          "place": "Place Name",
          "description": "Description here.",
          "category": "nightlife",
          "placeType": "city",
          "imageSearchKeyword": "Destination Scenic Area",
          "tourUrl": "https://www.viator.com/searchResults/all?text=Place+Name+Destination"
        }
      ]
    }
  ]
}`;

/* ═══════════════════════════════════════════════════════════════
   PHASE 1: Stock Photography Fallbacks (Unsplash → Pexels)
   ═══════════════════════════════════════════════════════════════ */

/**
 * Fetches a photo from the Unsplash API.
 * @param {string} query — search term (e.g. "Luxury Restaurant Beverly Hills")
 * @returns {string|null} — image URL or null
 */
async function getUnsplashPhoto(query) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.warn("⚠️  UNSPLASH_ACCESS_KEY is not set — skipping Unsplash.");
    return null;
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query
    )}&per_page=1&orientation=landscape`;

    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });

    if (!res.ok) {
      console.warn(`Unsplash API error (${res.status}):`, await res.text());
      return null;
    }

    const data = await res.json();
    const imageUrl = data?.results?.[0]?.urls?.regular || null;
    console.log("🖼️  Unsplash Result for [" + query + "]:", imageUrl || "null");
    return imageUrl;
  } catch (err) {
    console.warn("Unsplash fetch failed:", err.message);
    return null;
  }
}

/**
 * Fetches a photo from the Pexels API.
 * @param {string} query — search term
 * @returns {string|null} — image URL or null
 */
async function getPexelsPhoto(query) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.warn("⚠️  PEXELS_API_KEY is not set — skipping Pexels.");
    return null;
  }

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
      query
    )}&per_page=1&orientation=landscape`;

    const res = await fetch(url, {
      headers: { Authorization: apiKey },
    });

    if (!res.ok) {
      console.warn(`Pexels API error (${res.status}):`, await res.text());
      return null;
    }

    const data = await res.json();
    const imageUrl = data?.photos?.[0]?.src?.large || null;
    console.log("🖼️  Pexels Result for [" + query + "]:", imageUrl || "null");
    return imageUrl;
  } catch (err) {
    console.warn("Pexels fetch failed:", err.message);
    return null;
  }
}

/**
 * Wrapper: tries Unsplash first, then Pexels as a last resort.
 * @param {string} query — search term
 * @returns {string|null} — image URL or null (should almost never be null)
 */
async function getFallbackPhoto(query) {
  console.log("🔄 Fallback triggered for query: \"" + query + "\"");

  // Tier 1: Unsplash
  try {
    const unsplashUrl = await getUnsplashPhoto(query);
    if (unsplashUrl) return unsplashUrl;
  } catch (err) {
    console.warn("Unsplash threw inside fallback:", err.message);
  }

  // Tier 2: Pexels (last resort)
  try {
    const pexelsUrl = await getPexelsPhoto(query);
    if (pexelsUrl) return pexelsUrl;
  } catch (err) {
    console.warn("Pexels threw inside fallback:", err.message);
  }

  console.warn("⚠️  All fallbacks exhausted for query: \"" + query + "\"");
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 2: Foursquare Venue Waterfall
   (Hotels, Restaurants, Cafés → Foursquare → Unsplash → Pexels)
   ═══════════════════════════════════════════════════════════════ */

/**
 * Fetches a venue photo from the Foursquare Places API.
 * If Foursquare fails or returns no photos, falls back to
 * Unsplash → Pexels via getFallbackPhoto().
 *
 * @param {string} venueName — specific venue name (e.g. "The Belvedere")
 * @param {string} location  — city/area (e.g. "Beverly Hills")
 * @param {string} venueType — placeType for fallback context (e.g. "restaurant")
 * @returns {string|null} — image URL
 */
async function getFoursquarePhoto(venueName, location, venueType) {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) {
    console.warn("⚠️  FOURSQUARE_API_KEY is not set — jumping to fallback.");
    return await getFallbackPhoto((venueType || "venue") + " " + location);
  }

  const headers = {
    Accept: "application/json",
    Authorization: apiKey,
  };

  try {
    // ── Step 1: Search for the venue to get fsq_id ──
    const searchUrl = `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(
      venueName
    )}&near=${encodeURIComponent(location)}&limit=1`;

    const searchRes = await fetch(searchUrl, { headers });
    if (!searchRes.ok) {
      console.warn(`Foursquare search failed (${searchRes.status}):`, await searchRes.text());
      throw new Error(`Foursquare search HTTP ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    const fsqId = searchData?.results?.[0]?.fsq_id;
    if (!fsqId) {
      console.warn(`Foursquare: No venue found for "${venueName}" near "${location}".`);
      throw new Error("No Foursquare venue found");
    }

    // ── Step 2: Fetch photos for the venue ──
    const photosUrl = `https://api.foursquare.com/v3/places/${fsqId}/photos?limit=1`;

    const photosRes = await fetch(photosUrl, { headers });
    if (!photosRes.ok) {
      console.warn(`Foursquare photos failed (${photosRes.status}):`, await photosRes.text());
      throw new Error(`Foursquare photos HTTP ${photosRes.status}`);
    }

    const photos = await photosRes.json();
    if (!Array.isArray(photos) || photos.length === 0) {
      console.warn(`Foursquare: No photos for venue "${venueName}" (${fsqId}).`);
      throw new Error("No Foursquare photos for venue");
    }

    // Construct the image URL: prefix + 'original' + suffix
    const photo = photos[0];
    const imageUrl = `${photo.prefix}original${photo.suffix}`;
    console.log("✅ Foursquare Result for [" + venueName + "] near [" + location + "]:", imageUrl);
    return imageUrl;
  } catch (err) {
    // ── WATERFALL: Foursquare failed → Unsplash → Pexels ──
    console.warn("Foursquare waterfall catch:", err.message);
    const fallbackQuery = (venueType || "venue") + " " + location;
    console.log("🔄 Foursquare failed for \"" + venueName + "\" — falling back with query: \"" + fallbackQuery + "\"");
    return await getFallbackPhoto(fallbackQuery);
  }
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 3: WikiMedia Landmark Waterfall
   (Cities, Landmarks, Monuments → WikiMedia → Unsplash → Pexels)
   ═══════════════════════════════════════════════════════════════ */

/**
 * Fetches a photo from WikiMedia Commons / Wikipedia.
 * Includes Smart Flag Prevention: if the query contains a comma
 * (e.g. "London, UK"), appends " skyline" to avoid flag results.
 * Filters out .svg files.
 *
 * If WikiMedia returns null or only a flag/svg, falls back to
 * Unsplash → Pexels via getFallbackPhoto().
 *
 * @param {string} searchQuery — landmark or city name
 * @returns {string|null} — image URL
 */
async function getWikiMediaPhoto(searchQuery) {
  try {
    // ── Smart Flag Prevention ──
    // If query has a comma (e.g. "London, UK"), it's likely a city → append " skyline"
    // If no comma (e.g. "London Eye"), it's a specific landmark → use as-is
    let wikiQuery = searchQuery;
    if (searchQuery.includes(",")) {
      wikiQuery = searchQuery.split(",")[0].trim() + " skyline";
      console.log("🏙️  Flag prevention: \"" + searchQuery + "\" → \"" + wikiQuery + "\"");
    }

    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(
      wikiQuery
    )}`;

    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`WikiMedia API error (${res.status})`);
      throw new Error(`WikiMedia HTTP ${res.status}`);
    }

    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) throw new Error("WikiMedia returned no pages");

    // Pages is an object keyed by page ID — grab the first one
    const pageId = Object.keys(pages)[0];
    if (!pageId || pageId === "-1") {
      console.warn("WikiMedia: No page found for \"" + wikiQuery + "\"");
      throw new Error("No WikiMedia page found");
    }

    const imageUrl = pages[pageId]?.original?.source;

    // ── Filter out .svg files (flags, coat of arms, etc.) ──
    if (!imageUrl || imageUrl.toLowerCase().endsWith(".svg")) {
      console.warn("WikiMedia: Result is null or SVG for \"" + wikiQuery + "\" — skipping.");
      throw new Error("WikiMedia returned SVG or null");
    }

    // ── Additional flag detection: check for common flag patterns ──
    const lowerUrl = imageUrl.toLowerCase();
    if (
      lowerUrl.includes("flag_of_") ||
      lowerUrl.includes("flag-of-") ||
      lowerUrl.includes("coat_of_arms") ||
      lowerUrl.includes("emblem_of_")
    ) {
      console.warn("WikiMedia: Detected flag/emblem image for \"" + wikiQuery + "\" — skipping.");
      throw new Error("WikiMedia returned a flag/emblem");
    }

    console.log("✅ WikiMedia Result for [" + wikiQuery + "]:", imageUrl);
    return imageUrl;
  } catch (err) {
    // ── WATERFALL: WikiMedia failed → Unsplash → Pexels ──
    console.warn("WikiMedia waterfall catch:", err.message);
    console.log("🔄 WikiMedia failed for \"" + searchQuery + "\" — falling back to stock photos.");
    return await getFallbackPhoto(searchQuery);
  }
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 4: Dual-Routing Photo Fetcher (Orchestrator)
   Routes to the correct waterfall based on placeType
   ═══════════════════════════════════════════════════════════════ */

/**
 * Master routing function. Determines which waterfall to invoke
 * based on the activity's placeType.
 *
 * Commercial venues → Foursquare Waterfall (→ Unsplash → Pexels)
 * Landmarks/cities  → WikiMedia  Waterfall (→ Unsplash → Pexels)
 *
 * @param {object} activity    — single itinerary activity object
 * @param {string} destination — trip destination (e.g. "Paris, France")
 * @returns {string|null} — guaranteed image URL (virtually never null)
 */
async function getActivityPhoto(activity, destination) {
  const placeType = (activity.placeType || "").toLowerCase();
  const searchKeyword = activity.imageSearchKeyword || activity.place || destination;

  console.log(`\n📸 Fetching image for "${activity.place}" [${placeType}] — keyword: "${searchKeyword}"`);

  // ── Commercial venues → Foursquare Waterfall ──
  if (["hotel", "restaurant", "cafe"].includes(placeType)) {
    return await getFoursquarePhoto(activity.place, destination, placeType);
  }

  // ── Landmarks, monuments, cities → WikiMedia Waterfall ──
  if (["landmark", "monument", "city"].includes(placeType)) {
    return await getWikiMediaPhoto(searchKeyword);
  }

  // ── Unknown placeType → try WikiMedia waterfall as default ──
  console.warn("⚠️  Unknown placeType \"" + placeType + "\" — defaulting to WikiMedia waterfall.");
  return await getWikiMediaPhoto(searchKeyword);
}

/* ═══════════════════════════════════════════════════════════════
   POST /api/generate — Itinerary Generation
   ═══════════════════════════════════════════════════════════════ */
app.post("/api/generate", async (req, res) => {
  try {
    // Validate API key
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error:
          "Groq API key is not configured. Please add GROQ_API_KEY to your .env file.",
      });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const { destination, days, budget, vibe } = req.body;

    // Validate inputs
    if (!destination || !days || !budget || !vibe) {
      return res.status(400).json({
        error:
          "Missing required fields: destination, days, budget, and vibe are all required.",
      });
    }

    if (days < 1 || days > 14) {
      return res
        .status(400)
        .json({ error: "Number of days must be between 1 and 14." });
    }

    const userPrompt = `Plan a ${days}-day trip to ${destination}.
Budget level: ${budget}
Travel vibe: ${vibe}

Generate a complete day-by-day itinerary following the exact JSON structure from your instructions. Remember to include the placeType and imageSearchKeyword fields for every activity.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return res
        .status(500)
        .json({ error: "AI returned an empty response. Please try again." });
    }

    // Parse and validate the JSON
    const parsed = JSON.parse(content);

    if (!parsed.trip || !Array.isArray(parsed.trip)) {
      return res.status(500).json({
        error: "AI returned an unexpected format. Please try again.",
      });
    }

    // ── Fetch images for every activity using Smart Waterfall ──
    console.log("\n" + "═".repeat(60));
    console.log("🌊 SMART WATERFALL — Fetching images for", destination);
    console.log("═".repeat(60));

    const imagePromises = [];

    for (const day of parsed.trip) {
      if (!day.activities || !Array.isArray(day.activities)) continue;

      for (const activity of day.activities) {
        const promise = getActivityPhoto(activity, destination).then(
          (url) => {
            activity.imageUrl = url;
          }
        );
        imagePromises.push(promise);
      }
    }

    // Fetch all images in parallel for speed
    await Promise.all(imagePromises);

    // ── Summary log ──
    let totalImages = 0;
    let nullImages = 0;
    for (const day of parsed.trip) {
      for (const activity of day.activities || []) {
        totalImages++;
        if (!activity.imageUrl) nullImages++;
      }
    }
    console.log("\n" + "─".repeat(60));
    console.log(`📊 Image fetch complete: ${totalImages - nullImages}/${totalImages} images resolved.`);
    if (nullImages > 0) {
      console.warn(`⚠️  ${nullImages} image(s) could not be resolved despite all fallbacks.`);
    } else {
      console.log("✅ All images resolved successfully — zero nulls!");
    }
    console.log("─".repeat(60) + "\n");

    // ── DEBUG: Log sample activity from Day 1 ──
    if (parsed.trip?.[0]?.activities?.[0]) {
      console.log("FINAL ITINERARY PAYLOAD DAY 1, ITEM 1:", JSON.stringify(parsed.trip[0].activities[0], null, 2));
    }

    return res.json(parsed);
  } catch (error) {
    console.error("API Error:", error);

    if (error instanceof SyntaxError) {
      return res
        .status(500)
        .json({ error: "Failed to parse AI response. Please try again." });
    }

    // Handle Groq-specific errors
    if (error && typeof error === "object" && "status" in error) {
      if (error.status === 401) {
        return res.status(401).json({
          error: "Invalid Groq API key. Please check your .env file.",
        });
      }
      if (error.status === 429) {
        return res.status(429).json({
          error: "Rate limit exceeded. Please wait a moment and try again.",
        });
      }
    }

    return res.status(500).json({
      error:
        "Something went wrong generating your itinerary. Please try again.",
    });
  }
});


/* ═══════════════════════════════════════════════════════════════
   CLOUDANT — User Profile Routes
   ═══════════════════════════════════════════════════════════════ */

/**
 * GET /api/user/:email
 * Fetch user profile from Cloudant.
 */
app.get("/api/user/:email", async (req, res) => {
  if (!cloudant) {
    return res.status(503).json({ error: "Database not configured." });
  }
  const docId = `user::${req.params.email}`;
  try {
    const response = await cloudant.getDocument({ db: DB_USERS, docId });
    return res.json(response.result);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: "User not found." });
    console.error("GET /api/user error:", err.message);
    return res.status(500).json({ error: "Failed to fetch user profile." });
  }
});

/**
 * POST /api/user
 * Create or update a user profile.
 * Body: { email, name }
 */
app.post("/api/user", async (req, res) => {
  if (!cloudant) {
    return res.status(503).json({ error: "Database not configured." });
  }
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: "email is required." });

  const docId = `user::${email}`;
  const now = Date.now();

  try {
    // Try to get existing doc to preserve _rev for updates
    let rev;
    try {
      const existing = await cloudant.getDocument({ db: DB_USERS, docId });
      rev = existing.result._rev;
    } catch (e) {
      if (e.status !== 404) throw e;
    }

    const doc = {
      _id: docId,
      ...(rev ? { _rev: rev } : {}),
      email,
      name: name || email,
      lastSeen: now,
      ...(rev ? {} : { createdAt: now }),
    };

    const response = await cloudant.putDocument({ db: DB_USERS, docId, document: doc });
    return res.json({ ok: true, id: response.result.id, rev: response.result.rev });
  } catch (err) {
    console.error("POST /api/user error:", err.message);
    return res.status(500).json({ error: "Failed to save user profile." });
  }
});

/* ═══════════════════════════════════════════════════════════════
   CLOUDANT — Saved Trips Routes
   ═══════════════════════════════════════════════════════════════ */

/**
 * GET /api/trips/:email
 * Fetch all saved trips for a user.
 */
app.get("/api/trips/:email", async (req, res) => {
  if (!cloudant) {
    return res.status(503).json({ error: "Database not configured." });
  }
  const { email } = req.params;
  const prefix = `trip::${email}::`;

  try {
    const response = await cloudant.allDocs({
      db: DB_TRIPS,
      includeDocs: true,
      startKey: prefix,
      endKey: prefix + "\ufff0",
    });
    const trips = response.result.rows
      .filter((row) => !row.value.deleted)
      .map((row) => row.doc);
    return res.json({ trips });
  } catch (err) {
    console.error("GET /api/trips error:", err.message);
    return res.status(500).json({ error: "Failed to fetch saved trips." });
  }
});

/**
 * POST /api/trips
 * Save a new trip.
 * Body: { email, tripData: { destination, days, budget, vibe, itinerary, savedAt } }
 */
app.post("/api/trips", async (req, res) => {
  if (!cloudant) {
    return res.status(503).json({ error: "Database not configured." });
  }
  const { email, tripData } = req.body;
  if (!email || !tripData) {
    return res.status(400).json({ error: "email and tripData are required." });
  }

  const savedAt = tripData.savedAt || Date.now();
  const docId = `trip::${email}::${savedAt}`;

  const doc = {
    _id: docId,
    userId: email,
    destination: tripData.destination,
    days: tripData.days,
    budget: tripData.budget,
    vibe: tripData.vibe,
    itinerary: tripData.itinerary,
    savedAt,
  };

  try {
    const response = await cloudant.putDocument({ db: DB_TRIPS, docId, document: doc });
    return res.json({ ok: true, id: response.result.id, rev: response.result.rev, savedAt });
  } catch (err) {
    console.error("POST /api/trips error:", err.message);
    return res.status(500).json({ error: "Failed to save trip." });
  }
});

/**
 * DELETE /api/trips/:email/:tripId
 * Delete a saved trip by its savedAt timestamp (tripId).
 */
app.delete("/api/trips/:email/:tripId", async (req, res) => {
  if (!cloudant) {
    return res.status(503).json({ error: "Database not configured." });
  }
  const { email, tripId } = req.params;
  const docId = `trip::${email}::${tripId}`;

  try {
    const existing = await cloudant.getDocument({ db: DB_TRIPS, docId });
    const rev = existing.result._rev;
    await cloudant.deleteDocument({ db: DB_TRIPS, docId, rev });
    return res.json({ ok: true });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: "Trip not found." });
    console.error("DELETE /api/trips error:", err.message);
    return res.status(500).json({ error: "Failed to delete trip." });
  }
});

/* ─── Start Server ─── */
setupCloudant().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Trekko API server running at http://localhost:${PORT}`);
    console.log("🌊 Smart Waterfall Architecture Active:");
    console.log("   Hotels/Restaurants/Cafés → Foursquare → Unsplash → Pexels");
    console.log("   Landmarks/Monuments/Cities → WikiMedia → Unsplash → Pexels");
    console.log(`   Unsplash Key:  ${process.env.UNSPLASH_ACCESS_KEY ? "✅ Set" : "❌ Missing"}`);
    console.log(`   Pexels Key:    ${process.env.PEXELS_API_KEY ? "✅ Set" : "❌ Missing"}`);
    console.log(`   Foursquare:    ${process.env.FOURSQUARE_API_KEY ? "✅ Set" : "❌ Missing"}`);
    console.log(`   Cloudant DB:   ${cloudant ? "✅ Connected" : "⚠️  Not configured"}\n`);
  });
});


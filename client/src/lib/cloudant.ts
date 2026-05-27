/**
 * Trekko — Cloudant API Client
 * Thin wrappers around the Express backend's Cloudant endpoints.
 * All functions return null (never throw) when the DB is unavailable,
 * so the app can fall back to localStorage gracefully.
 */

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "https://trekko-d9ek.onrender.com";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CloudantUserProfile {
  _id: string;
  _rev?: string;
  email: string;
  name: string;
  createdAt: number;
  lastSeen: number;
}

export interface CloudantTrip {
  _id: string;
  _rev?: string;
  userId: string;
  destination: string;
  days: number;
  budget: string;
  vibe: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itinerary: any[];
  savedAt: number;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

/**
 * Fetch a user profile from Cloudant.
 * Returns null if the user doesn't exist or DB is unavailable.
 */
export async function getUserProfile(email: string): Promise<CloudantUserProfile | null> {
  try {
    const res = await fetch(`${BACKEND}/api/user/${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Create or update a user profile in Cloudant.
 * Called on every sign-in to keep lastSeen current.
 * Returns false if the DB is unavailable.
 */
export async function upsertUserProfile(email: string, name: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND}/api/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Saved Trips ─────────────────────────────────────────────────────────────

/**
 * Fetch all saved trips for a user from Cloudant.
 * Returns an empty array if the DB is unavailable.
 */
export async function getSavedTrips(email: string): Promise<CloudantTrip[]> {
  try {
    const res = await fetch(`${BACKEND}/api/trips/${encodeURIComponent(email)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.trips ?? [];
  } catch {
    return [];
  }
}

/**
 * Save a trip to Cloudant.
 * Returns the savedAt timestamp (used as the trip's unique ID) or null on failure.
 */
export async function saveTrip(
  email: string,
  tripData: {
    destination: string;
    days: number;
    budget: string;
    vibe: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itinerary: any[];
    savedAt: number;
  }
): Promise<number | null> {
  try {
    const res = await fetch(`${BACKEND}/api/trips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, tripData }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.savedAt ?? tripData.savedAt;
  } catch {
    return null;
  }
}

/**
 * Delete a saved trip from Cloudant.
 * tripId is the savedAt timestamp string.
 * Returns true on success, false otherwise.
 */
export async function deleteTrip(email: string, tripId: string | number): Promise<boolean> {
  try {
    const res = await fetch(
      `${BACKEND}/api/trips/${encodeURIComponent(email)}/${tripId}`,
      { method: "DELETE" }
    );
    return res.ok;
  } catch {
    return false;
  }
}

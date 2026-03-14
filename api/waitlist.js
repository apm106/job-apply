const { Pool } = require("pg");

let pool;
const ANALYTICS_ROUTE = "/api/waitlist";

function getPool() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
    });
  }

  return pool;
}

function isValidEmail(email) {
  return /.+@.+\..+/.test(email);
}

function analyticsConfig() {
  const publicKey = process.env.POSTHOG_PUBLIC_KEY;
  const host = String(process.env.POSTHOG_HOST || "")
    .trim()
    .replace(/\/+$/, "");

  if (!publicKey || !host) {
    return null;
  }

  return { publicKey, host };
}

async function trackApiEvent(event, properties) {
  const config = analyticsConfig();
  if (!config) {
    return;
  }

  try {
    await fetch(`${config.host}/capture/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: config.publicKey,
        event,
        properties: {
          distinct_id: "api_waitlist",
          source: "backend",
          route: ANALYTICS_ROUTE,
          ...properties
        }
      })
    });
  } catch (_error) {
    // Intentionally swallow analytics failures.
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const db = getPool();
  if (!db) {
    return res.status(500).json({ error: "Server is not configured" });
  }

  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();

  if (!name || !email) {
    await trackApiEvent("waitlist_api_validation_error", {
      outcome: "validation_error",
      status_class: "4xx",
      error_category: "missing_fields",
      at: new Date().toISOString()
    });
    return res.status(400).json({ error: "Name and email are required" });
  }

  if (!isValidEmail(email)) {
    await trackApiEvent("waitlist_api_validation_error", {
      outcome: "validation_error",
      status_class: "4xx",
      error_category: "invalid_email",
      at: new Date().toISOString()
    });
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    await db.query(
      `INSERT INTO waitlist_entries (name, email)
       VALUES ($1, $2)`,
      [name, email]
    );

    await trackApiEvent("waitlist_api_success", {
      outcome: "success",
      status_class: "2xx",
      at: new Date().toISOString()
    });

    return res.status(201).json({ ok: true });
  } catch (error) {
    if (error.code === "23505") {
      await trackApiEvent("waitlist_api_duplicate_email", {
        outcome: "duplicate_email",
        status_class: "4xx",
        error_category: "unique_violation",
        at: new Date().toISOString()
      });
      return res.status(409).json({ error: "Email is already on the waitlist" });
    }

    await trackApiEvent("waitlist_api_server_error", {
      outcome: "server_error",
      status_class: "5xx",
      error_category: "db_or_unknown",
      at: new Date().toISOString()
    });

    return res.status(500).json({ error: "Could not save waitlist entry" });
  }
};

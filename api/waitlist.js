const { Pool } = require("pg");

let pool;

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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const db = getPool();
  if (!db) {
    return res.status(500).json({ error: "Server is not configured" });
  }

  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    await db.query(
      `INSERT INTO waitlist_entries (name, email)
       VALUES ($1, $2)`,
      [name, email]
    );

    return res.status(201).json({ ok: true });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email is already on the waitlist" });
    }

    return res.status(500).json({ error: "Could not save waitlist entry" });
  }
};

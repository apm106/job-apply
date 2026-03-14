const { createHash } = require("crypto");
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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const db = getPool();
  if (!db) {
    return res.status(500).json({ error: "Server is not configured" });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  const token = String(req.body?.token || "").trim();

  if (!email || !token) {
    return res.status(400).json({ error: "Email and token are required" });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  try {
    const result = await db.query(
      `UPDATE waitlist_entries
       SET verified_at = NOW(),
           verification_token_hash = NULL,
           verification_token_expires_at = NULL
       WHERE email = $1
         AND verification_token_hash = $2
         AND verification_token_expires_at > NOW()
         AND verified_at IS NULL
       RETURNING id`,
      [email, tokenHash]
    );

    if (result.rowCount === 0) {
      const existing = await db.query(
        `SELECT verified_at FROM waitlist_entries WHERE email = $1`,
        [email]
      );

      if (existing.rowCount > 0 && existing.rows[0].verified_at) {
        return res.status(200).json({ ok: true, alreadyVerified: true });
      }

      return res.status(400).json({ error: "Invalid or expired verification link" });
    }

    return res.status(200).json({ ok: true, verified: true });
  } catch (error) {
    return res.status(500).json({ error: "Could not verify email" });
  }
};

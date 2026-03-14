const { randomBytes, createHash } = require("crypto");
const { Pool } = require("pg");

const TOKEN_TTL_HOURS = 24;
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

function createVerificationToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

function getAppBaseUrl() {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return null;
}

async function sendVerificationEmail({ email, name, token }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  const appBaseUrl = getAppBaseUrl();

  if (!resendApiKey || !fromEmail || !appBaseUrl) {
    throw new Error("Email provider is not configured");
  }

  const verifyUrl = `${appBaseUrl}/verify.html?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: "Confirm your OneClickGrad waitlist signup",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f1711;">
          <h2>Confirm your email</h2>
          <p>Hi ${name},</p>
          <p>Please confirm your email to complete your OneClickGrad waitlist signup.</p>
          <p><a href="${verifyUrl}" style="display:inline-block;background:#0c7a5c;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none;">Confirm Email</a></p>
          <p>If the button does not work, copy and paste this link:</p>
          <p>${verifyUrl}</p>
          <p>This link expires in ${TOKEN_TTL_HOURS} hours.</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    throw new Error("Failed to send verification email");
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
  const email = String(req.body?.email || "").trim().toLowerCase();

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  const { token, tokenHash } = createVerificationToken();

  try {
    const existing = await db.query(
      `SELECT verified_at FROM waitlist_entries WHERE email = $1`,
      [email]
    );

    if (existing.rowCount > 0 && existing.rows[0].verified_at) {
      return res.status(200).json({ ok: true, alreadyVerified: true });
    }

    await db.query(
      `INSERT INTO waitlist_entries (
        name,
        email,
        verification_token_hash,
        verification_token_expires_at,
        verification_sent_at
      )
      VALUES ($1, $2, $3, NOW() + INTERVAL '${TOKEN_TTL_HOURS} hours', NOW())
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        verification_token_hash = EXCLUDED.verification_token_hash,
        verification_token_expires_at = EXCLUDED.verification_token_expires_at,
        verification_sent_at = NOW()`,
      [name, email, tokenHash]
    );

    await sendVerificationEmail({ email, name, token });

    return res.status(201).json({ ok: true, verificationSent: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Could not process waitlist signup" });
  }
};

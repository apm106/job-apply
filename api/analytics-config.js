module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const publicKey = process.env.POSTHOG_PUBLIC_KEY;
  const host = process.env.POSTHOG_HOST;

  if (!publicKey || !host) {
    return res.status(204).end();
  }

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    publicKey,
    host
  });
};

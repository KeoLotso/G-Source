export default async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).end()
    return
  }

  const config = {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY
  }

  if (!config.url || !config.anonKey) {
    res.status(500).json({ error: 'missing_supabase_config' })
    return
  }

  res.status(200).json(config)
}
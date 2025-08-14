export default async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  let body = req.body
  if (!body || (typeof body === 'string')) {
    try {
      const raw = typeof body === 'string' ? body : await new Promise(resolve => {
        let d = ''
        req.on('data', c => d += c)
        req.on('end', () => resolve(d))
      })
      body = raw ? JSON.parse(raw) : {}
    } catch {
      body = {}
    }
  }

  const code = body.code
  const dynamicRedirect = body.redirectUri
  const redirect_uri = dynamicRedirect || process.env.DISCORD_REDIRECT_URI

  if (!code || !redirect_uri) {
    res.status(400).json({ error: 'missing_params' })
    return
  }

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri
  })

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })

  const tokenData = await tokenRes.json()
  if (!tokenRes.ok || !tokenData.access_token) {
    res.status(400).json({ error: 'token_error', details: tokenData })
    return
  }

  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  })

  const userData = await userRes.json()
  if (!userRes.ok || !userData.id) {
    res.status(400).json({ error: 'user_error', details: userData })
    return
  }

  res.status(200).json(userData)
}

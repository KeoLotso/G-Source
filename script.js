const clientId = '1405637510008279177'
const redirectUri = window.location.origin
const scopes = 'identify'

const userInfoEl = document.getElementById('user-info')
const displayNameEl = document.getElementById('display-name')
const avatarEl = document.getElementById('avatar')

function avatarUrl(u){
  if (u.avatar) {
    const ext = u.avatar.startsWith('a_') ? 'gif' : 'png'
    return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${ext}`
  }
  const n = Number(BigInt(u.id) % 5n)
  return `https://cdn.discordapp.com/embed/avatars/${n}.png`
}

function showUser(user){
  displayNameEl.textContent = user.global_name || user.username
  avatarEl.src = avatarUrl(user)
  avatarEl.style.display = 'block'
}

function showLogin(){
  displayNameEl.textContent = 'Login'
  avatarEl.style.display = 'none'
}

userInfoEl.onclick = () => {
  if (!localStorage.getItem('discord_user')) {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}`
    window.location.href = authUrl
  } else {
    localStorage.removeItem('discord_user')
    showLogin()
  }
}

async function handleOAuthCode(){
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (!code) return
  try{
    const res = await fetch('/api/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri })
    })
    if (!res.ok) throw new Error('exchange_failed')
    const user = await res.json()
    if (!user || !user.id) throw new Error('invalid_user')
    localStorage.setItem('discord_user', JSON.stringify(user))
    window.history.replaceState({}, document.title, '/')
    showUser(user)
  }catch(e){
    showLogin()
  }
}

const stored = localStorage.getItem('discord_user')
if (stored){
  showUser(JSON.parse(stored))
}else{
  showLogin()
  handleOAuthCode()
}

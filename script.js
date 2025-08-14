const clientId = '1405637510008279177'
const redirectUri = window.location.origin
const scopes = 'identify'

const displayNameEl = document.getElementById('display-name')
const avatarEl = document.getElementById('avatar')

function showUser(user) {
  displayNameEl.textContent = user.username
  avatarEl.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
  avatarEl.style.display = 'block'
}

function showLogin() {
  displayNameEl.textContent = 'Login'
  avatarEl.style.display = 'none'
}

displayNameEl.onclick = () => {
  if (!localStorage.getItem('discord_user')) {
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}`
  } else {
    localStorage.removeItem('discord_user')
    showLogin()
  }
}

const params = new URLSearchParams(window.location.search)
const code = params.get('code')

if (code) {
  fetch('/api/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  })
    .then(res => res.json())
    .then(user => {
      localStorage.setItem('discord_user', JSON.stringify(user))
      window.history.replaceState({}, document.title, '/')
      showUser(user)
    })
}

const storedUser = localStorage.getItem('discord_user')
if (storedUser) {
  showUser(JSON.parse(storedUser))
} else {
  showLogin()
}

const clientId = '1405637510008279177'
const redirectUri = window.location.origin + '/callback.html'
const scopes = 'identify'

document.getElementById('login-btn').onclick = () => {
  window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}`
}

document.getElementById('logout-btn').onclick = () => {
  localStorage.removeItem('discord_user')
  showLogin()
}

function showLogin() {
  document.getElementById('login-card').style.display = 'block'
  document.getElementById('user-card').style.display = 'none'
}

function showUser(user) {
  document.getElementById('username').textContent = user.username
  document.getElementById('avatar').src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
  document.getElementById('login-card').style.display = 'none'
  document.getElementById('user-card').style.display = 'block'
}

const storedUser = localStorage.getItem('discord_user')
if (storedUser) showUser(JSON.parse(storedUser))

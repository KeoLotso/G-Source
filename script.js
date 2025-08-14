const clientId = '1405637510008279177';
const redirectUri = window.location.origin;
const scopes = 'identify';

const guestAuthEl = document.getElementById('guest-auth');
const userInfoEl = document.getElementById('user-info');
const userNameEl = document.getElementById('user-name');
const userAvatarEl = document.getElementById('user-avatar');

function avatarUrl(user) {
  if (user.avatar) {
    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}`;
  }
  const n = Number(BigInt(user.id) % 5n);
  return `https://cdn.discordapp.com/embed/avatars/${n}.png`;
}

function showUser(user) {
  userNameEl.textContent = user.global_name || user.username;
  userAvatarEl.src = avatarUrl(user);
  guestAuthEl.classList.add('hidden');
  userInfoEl.classList.remove('hidden');
}

function showGuest() {
  guestAuthEl.classList.remove('hidden');
  userInfoEl.classList.add('hidden');
}

guestAuthEl.addEventListener('click', () => {
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}`;
  window.location.href = authUrl;
});

userInfoEl.addEventListener('click', () => {
  const stored = JSON.parse(window.sessionStorage?.getItem('discord_user') || 'null');
  if (stored) {
    if (window.sessionStorage) {
      window.sessionStorage.removeItem('discord_user');
    }
    showGuest();
  }
});

async function handleOAuthCode() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) return;

  try {
    const res = await fetch('/api/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri })
    });

    if (!res.ok) throw new Error('Exchange failed');

    const user = await res.json();
    if (!user || !user.id) throw new Error('Invalid user data');

    if (window.sessionStorage) {
      window.sessionStorage.setItem('discord_user', JSON.stringify(user));
    }
    window.history.replaceState({}, document.title, '/');
    showUser(user);
  } catch (error) {
    console.error('OAuth error:', error);
    showGuest();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const stored = window.sessionStorage?.getItem('discord_user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      showUser(user);
    } catch {
      showGuest();
    }
  } else {
    showGuest();
    handleOAuthCode();
  }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
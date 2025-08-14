const clientId = '1405637510008279177';
const redirectUri = window.location.origin;
const scopes = 'identify';

const guestAuthEl = document.getElementById('guest-auth');
const userInfoEl = document.getElementById('user-info');
const userNameEl = document.getElementById('user-name');
const userAvatarEl = document.getElementById('user-avatar');
const profilePopup = document.getElementById('profile-popup');
const popupOverlay = document.getElementById('popup-overlay');
const logoutBtn = document.getElementById('logout-btn');
const popupAvatar = document.getElementById('popup-avatar');
const popupUsername = document.getElementById('popup-username');
const popupDiscriminator = document.getElementById('popup-discriminator');

let supabaseClient;

async function initSupabase() {
  try {
    const response = await fetch('/api/supabase-config');
    const config = await response.json();
    
    const { createClient } = supabase;
    supabaseClient = createClient(config.url, config.anonKey);
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
  }
}

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
  
  popupAvatar.src = avatarUrl(user);
  popupUsername.textContent = user.global_name || user.username;
  popupDiscriminator.textContent = user.discriminator ? `#${user.discriminator}` : '';
}

function showGuest() {
  guestAuthEl.classList.remove('hidden');
  userInfoEl.classList.add('hidden');
  hideProfilePopup();
}

function showProfilePopup() {
  profilePopup.classList.remove('hidden');
  popupOverlay.classList.remove('hidden');
}

function hideProfilePopup() {
  profilePopup.classList.add('hidden');
  popupOverlay.classList.add('hidden');
}

async function loadAboutContent() {
  try {
    const response = await fetch('About.json');
    const aboutData = await response.json();
    
    const aboutTextEl = document.getElementById('about-text');
    if (aboutData && aboutData.content) {
      aboutTextEl.innerHTML = aboutData.content;
    } else if (aboutData && aboutData.description) {
      aboutTextEl.innerHTML = `<p>${aboutData.description}</p>`;
    } else {
      aboutTextEl.innerHTML = '<p>Welcome to G-Source - your destination for resources and community.</p>';
    }
  } catch (error) {
    console.error('Failed to load About.json:', error);
    document.getElementById('about-text').innerHTML = '<p>Welcome to G-Source - your destination for resources and community.</p>';
  }
}

guestAuthEl.addEventListener('click', () => {
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}`;
  window.location.href = authUrl;
});

userInfoEl.addEventListener('click', (e) => {
  e.stopPropagation();
  showProfilePopup();
});

logoutBtn.addEventListener('click', () => {
  if (window.sessionStorage) {
    window.sessionStorage.removeItem('discord_user');
  }
  showGuest();
});

popupOverlay.addEventListener('click', hideProfilePopup);

document.addEventListener('click', (e) => {
  if (!profilePopup.contains(e.target) && !userInfoEl.contains(e.target)) {
    hideProfilePopup();
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
    
    if (supabaseClient) {
      try {
        await supabaseClient.from('users').upsert({
          discord_id: user.id,
          username: user.username,
          global_name: user.global_name,
          avatar: user.avatar,
          discriminator: user.discriminator,
          last_login: new Date().toISOString()
        }, { onConflict: 'discord_id' });
      } catch (error) {
        console.error('Failed to save user to database:', error);
      }
    }
    
    window.history.replaceState({}, document.title, '/');
    showUser(user);
  } catch (error) {
    console.error('OAuth error:', error);
    showGuest();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initSupabase();
  await loadAboutContent();
  
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
    const targetId = this.getAttribute('href').substring(1);
    
    if (targetId === 'about') {
      document.getElementById('about-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const target = document.querySelector(`#${targetId}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});
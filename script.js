/* ░░░ Dyad TestPro — secure access gate + site interactions ░░░

   The documentation is shipped as AES-256-GCM ciphertext (content.enc.js).
   The correct password derives the decryption key via PBKDF2; without it,
   nothing in the page source is readable. There is no plaintext fallback. */

const STORE_KEY = 'dtp_pw_v2';

const lockScreen = document.getElementById('lock-screen');
const lockForm   = document.getElementById('lock-form');
const lockInput  = document.getElementById('lock-input');
const lockError  = document.getElementById('lock-error');
const lockBtn    = document.getElementById('lock-btn');
const appRoot    = document.getElementById('app');

const b64ToBytes = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

async function deriveKey(password, salt, iterations) {
  const baseKey = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

async function decryptContent(password) {
  const enc = window.__DTP_ENC;
  if (!enc) throw new Error('payload missing');
  const salt = b64ToBytes(enc.s);
  const iv   = b64ToBytes(enc.i);
  const ct   = b64ToBytes(enc.c);
  const key  = await deriveKey(password, salt, enc.n);
  // throws if password is wrong (GCM auth tag mismatch)
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(plainBuf);
}

function revealSite(html) {
  appRoot.innerHTML = html;
  lockScreen.classList.add('hidden');
  document.body.classList.remove('locked');
  setTimeout(() => { lockScreen.style.display = 'none'; }, 500);
  initInteractions();
}

lockForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const val = lockInput.value;
  lockBtn.disabled = true;
  lockBtn.textContent = 'Unlocking…';
  try {
    const html = await decryptContent(val);
    try { sessionStorage.setItem(STORE_KEY, val); } catch (_) {}
    lockError.textContent = '';
    revealSite(html);
  } catch (err) {
    lockBtn.disabled = false;
    lockBtn.textContent = 'Unlock';
    lockError.textContent = 'Incorrect password. Please try again.';
    lockError.classList.remove('shake');
    void lockError.offsetWidth;
    lockError.classList.add('shake');
    lockInput.value = '';
    lockInput.focus();
  }
});

// Auto-unlock within the same browser session (password kept in sessionStorage only)
(async function tryRestore() {
  const saved = sessionStorage.getItem(STORE_KEY);
  if (!saved) { lockInput && lockInput.focus(); return; }
  try {
    const html = await decryptContent(saved);
    // restore instantly, no animation
    appRoot.innerHTML = html;
    lockScreen.style.display = 'none';
    document.body.classList.remove('locked');
    initInteractions();
  } catch (_) {
    sessionStorage.removeItem(STORE_KEY);
    lockInput && lockInput.focus();
  }
})();

/* ░░░ Interactions — wired up only AFTER content is injected ░░░ */
function initInteractions() {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
      })
    );
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        if (en.target.classList.contains('stats')) animateStats(en.target);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

function animateStats(scope) {
  scope.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const dur = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

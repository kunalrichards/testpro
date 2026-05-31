# TestPro AI — Documentation Site

A private, **encrypted** documentation & showcase website for **TestPro AI**,
the AI-powered test-case generator for the Nexsure platform.

Single-page static site (HTML + CSS + vanilla JS) — no build framework required.

## 🔒 How the protection works

The documentation content is **encrypted with AES-256-GCM** and shipped only as
ciphertext (`content.enc.js`). The page source contains **no readable content** —
viewing source, disabling JavaScript, or inspecting the DOM reveals nothing.

On entering the correct access password, the browser derives the decryption key with
**PBKDF2 (SHA-256, 210,000 iterations)** and decrypts the content client-side. A wrong
password fails the GCM authentication tag and decrypts nothing — there is no plaintext
fallback anywhere in the shipped files.

> The plaintext source (`build/content.src.html`) is **never published** — it lives only
> in the private source repo. The public publish repo contains ciphertext only.

## 📁 Structure

```
index.html        — Shell: lock screen + empty #app container (no content)
styles.css        — Theme, layout, responsive rules, animations
script.js         — Decrypt-on-unlock, content injection, interactions
content.enc.js    — AES-256-GCM ciphertext of the documentation (generated)
assets/           — Logo (SVG) + favicon
build/
  content.src.html — Plaintext source of the docs  (PRIVATE — do not publish)
  encrypt.js       — Regenerates content.enc.js
```

## ✏️ Editing the content

1. Edit `build/content.src.html`.
2. Regenerate the ciphertext:
   ```bash
   node build/encrypt.js "<access-password>"
   ```
3. Commit + push (see Publishing below).

## 🚀 Run locally

```bash
npx serve .
# then open the printed URL and enter the access password
```

## 🌐 Publishing

- **Source of truth:** private repo (full history, includes `build/`).
- **Live site:** a separate public repo serves GitHub Pages and contains **only**
  the safe files (`index.html`, `styles.css`, `script.js`, `content.enc.js`,
  `assets/`, `README.md`, `.nojekyll`) — never `build/`.

---

Built by **Kunal Richards** · Sr QA Engineer · © 2026 · Sole creator & owner

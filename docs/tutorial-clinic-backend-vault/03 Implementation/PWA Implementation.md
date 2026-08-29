---
title: PWA Implementation
status: implementation-ready
tags: [pwa, offline, vite, mobile]
---

# PWA implementation

## Current state

The codebase already includes `vite-plugin-pwa` and a `VitePWA` block in `vite.config.ts`. It precaches the app shell and declares a manifest. The implementation is not yet production-complete:

- `public/icons/pwa-192.png`, `pwa-512.png`, and `pwa-512-maskable.png` do not exist because there is no `public` directory.
- `favicon.svg` is included but does not exist.
- `registerType: "prompt"` is configured without an update/offline-ready prompt in React.
- The manifest theme color (`#12372a`) differs from the page theme color (`#FAF8F2`).
- There is no install prompt or iOS installation guidance.
- Offline cache, local account data, and Supabase mutation sync do not yet share one explicit lifecycle.

## Product behavior

The PWA should:

- install on supported Android/desktop browsers;
- provide correct icons, name, colors, and standalone display;
- open the cached application shell after the first successful online visit;
- show cached account data with a clear offline/stale state;
- queue only deterministic, eligible mutations;
- require connectivity for admin QR consumption, moderation, account provisioning, and file upload;
- prompt before applying an update so an in-progress form or scan is not lost;
- clear account-scoped caches on sign-out.

## 1. Add required assets

Create:

```text
public/
  favicon.svg
  icons/
    apple-touch-icon-180.png
    pwa-192.png
    pwa-512.png
    pwa-512-maskable.png
```

Requirements:

- PNG files use the exact pixel sizes in their names.
- The maskable icon keeps important artwork inside the central safe zone.
- Icons are real optimized images, not renamed JPEGs.
- Use the same Tutorial Clinic mark and test it on light/dark launchers.

Add to `index.html`:

```html
<meta name="theme-color" content="#FAF8F2" />
<link rel="icon" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
```

## 2. Complete the Vite PWA configuration

Keep the current plugin and align it to this baseline:

```ts
VitePWA({
  registerType: "prompt",
  injectRegister: null,
  includeAssets: [
    "favicon.svg",
    "icons/apple-touch-icon-180.png",
  ],
  manifest: {
    id: "/",
    name: "CCS Tutorial Clinic",
    short_name: "Tutorial Clinic",
    description:
      "Browse study sessions, RSVP, record attendance, and share approved notes.",
    theme_color: "#FAF8F2",
    background_color: "#FAF8F2",
    display: "standalone",
    orientation: "portrait-primary",
    scope: "/",
    start_url: "/",
    icons: [
      { src: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/pwa-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/pwa-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  },
  workbox: {
    cleanupOutdatedCaches: true,
    clientsClaim: false,
    skipWaiting: false,
    navigateFallback: "/index.html",
    globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
    navigateFallbackDenylist: [/^\/functions\//, /^\/auth\//],
  },
}),
```

Why:

- Prompted updates prevent an unexpected reload during a form or camera flow.
- The service worker precaches versioned static assets only.
- Supabase Auth, Data API, Edge Function, and private Storage responses must not be added to a broad Cache First rule.
- IndexedDB—not the Workbox Cache API—is the explicit cache for account data.

If hosted under a subpath rather than the domain root, set Vite `base` and derive `id`, `scope`, `start_url`, icon URLs, and navigation fallback from that base. Root-relative URLs will fail on an unconfigured GitHub Pages subpath.

## 3. Register the service worker in React

Add the client types:

```ts
/// <reference types="vite-plugin-pwa/client" />
```

Create a focused component using `virtual:pwa-register/react`:

```tsx
import { useRegisterSW } from "virtual:pwa-register/react";

export function PwaStatus() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error("Service worker registration failed", error);
    },
  });

  if (!offlineReady && !needRefresh) return null;

  return (
    <div role="status" aria-live="polite" className="pwa-update-toast">
      <p>
        {needRefresh
          ? "A new Tutorial Clinic version is ready."
          : "Tutorial Clinic is ready for offline use."}
      </p>
      {needRefresh && (
        <button onClick={() => updateServiceWorker(true)}>
          Update and reload
        </button>
      )}
      <button
        onClick={() => {
          setOfflineReady(false);
          setNeedRefresh(false);
        }}
      >
        Later
      </button>
    </div>
  );
}
```

Mount it once near the application shell. Use the existing toast/feedback components and accessible focus behavior instead of copying the minimal markup literally.

## 4. Add install UX

Create a `useInstallPrompt` hook that:

- listens for `beforeinstallprompt`;
- calls `event.preventDefault()` and stores the event only in memory;
- shows “Install Tutorial Clinic” from Settings or Help;
- calls `prompt()` only after a user gesture;
- hides the action after `appinstalled` or when `display-mode: standalone` matches;
- shows short “Share → Add to Home Screen” instructions on iOS, where `beforeinstallprompt` is unavailable.

Do not pressure users with an install modal on first load. Offer installation after they have signed in or completed a useful workflow.

## 5. Unify connectivity and sync UI

The project has both `ConnectionBanner` and an inline offline banner in `App.tsx`. Keep one shared component that displays:

- Offline—showing cached data
- Back online—syncing N changes
- All changes synced
- N changes need attention

Drive it from `useNetworkStatus` plus `useSyncStatus`. Network “online” only means a connection may exist; the first Supabase request remains the real health check.

## 6. Protect account data

- Partition IndexedDB records by the Auth UUID.
- Stop the sync loop before sign-out completes.
- Delete or quarantine pending mutations belonging to the signed-out account.
- Clear private cached data on explicit sign-out and account removal.
- Never cache passwords, raw QR tokens beyond their short display lifetime, secret keys, signed Storage URLs, or admin roster exports.
- Treat XSS prevention as essential because browser storage is accessible to scripts running in the origin.

## 7. PWA-safe sync rules

Keep sync in the foreground application for Phase 1. Browser Background Sync support and behavior vary, especially on iOS, and authentication may expire while the app is closed.

Trigger sync on:

- authenticated app startup;
- transition to online;
- visible-tab transition;
- explicit user retry;
- a bounded interval while the app is open.

Every operation must remain idempotent. See [[02 Architecture/Offline and Sync Strategy]].

## 8. Deployment requirements

- HTTPS is mandatory outside localhost.
- Serve the generated service worker with no-cache/revalidation headers.
- Serve hashed assets with long immutable caching.
- Ensure all SPA routes fall back to `index.html` without rewriting the service worker or manifest.
- Confirm the service worker scope covers the deployed app path.
- Do not serve two different applications under the same scope.

## 9. Verification

Test a production build, not only the Vite development server:

```powershell
npm run build
npm run preview
```

If `preview` is not present in `package.json`, add `"preview": "vite preview"`.

Verify:

- [ ] Manifest has no missing icons.
- [ ] Installability passes in Chromium DevTools.
- [ ] Android/desktop installation launches standalone.
- [ ] iOS Add to Home Screen icon/name are correct.
- [ ] Refreshing every React route works online.
- [ ] After one online load, app shell opens offline.
- [ ] Cached content is labeled offline/stale.
- [ ] Private Supabase/API responses are not present in Workbox caches.
- [ ] Update prompt appears after a new deployment.
- [ ] “Later” preserves the current session/form.
- [ ] “Update and reload” activates the new worker.
- [ ] Sign-out clears account-scoped cache/outbox.
- [ ] Final-slot RSVP and replay tests still pass through the PWA.
- [ ] Camera QR flow runs only on HTTPS/localhost and explains unsupported browsers.
- [ ] Lighthouse PWA/accessibility checks have no blocking failures.

## Acceptance criteria

PWA completion is done when the installed app is reliable but never misleading: students can open the shell and cached data offline, every pending change is visibly provisional, and security-sensitive actions wait for server confirmation.

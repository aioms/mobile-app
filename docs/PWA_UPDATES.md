# PWA updates

The web build uses two independent update signals:

1. The browser installs a new Workbox Service Worker and leaves it in the
   `waiting` state.
2. The running app polls the generated `/version.json` deployment manifest.

Both signals feed `PWAUpdateProvider`. They produce one notification per
deployment. A waiting worker is activated only after the user selects
**Cập nhật**. The app reloads once when the new worker takes control.

## Build metadata

Every Vite production build emits `/version.json` and injects the same metadata
into the running bundle. The deployment ID includes package version, Git commit,
CI build number, build time, and Vite mode.

`version.json` is intentionally excluded from Workbox precaching. Firebase
serves it, HTML, and `sw.js` with `no-cache, no-store, must-revalidate`. Hashed
assets and the hashed Workbox runtime use a one-year immutable cache.

## Configuration

| Variable | Default | Values |
| --- | --- | --- |
| `VITE_PWA_UPDATE_ENABLED` | `true` in production builds | `true`, `false` |
| `VITE_PWA_UPDATE_STRATEGY` | `both` | `both`, `service-worker`, `version` |
| `VITE_PWA_VERSION_URL` | `/version.json` | Same-origin or CORS-enabled URL |
| `VITE_PWA_POLL_INTERVAL_MS` | `900000` | Minimum `60000` |
| `VITE_PWA_NOTIFICATION_BEHAVIOR` | `prompt` | `prompt`, `disabled` |
| `VITE_PWA_LOG_LEVEL` | `info` | `silent`, `error`, `info`, `debug` |

Polling pauses while the document is hidden and resumes when it becomes visible
or the browser comes back online. Version request and Service Worker failures do
not block normal application use.

## Update-safe state

The browser remains on the current URL after reload. Persistent application
state continues to use the existing storage layer. Before worker activation,
the app dispatches an `app-update-accepted` window event so features with
transient form state can save it when needed.

## Release verification

After a production build, verify:

- `dist/version.json` exists and its deployment ID appears in a built JS bundle.
- `dist/sw.js` contains the `SKIP_WAITING` message handler.
- `version.json` is absent from the Service Worker precache manifest.
- Firebase returns no-store headers for HTML, `version.json`, and `sw.js`.
- Firebase returns immutable headers for `/assets/**` and `/workbox-*.js`.

# CCS Tutorial Clinic - Functional Front-End Demo v1

A presentation-ready React and TypeScript front-end for the Computer Science Society's peer-supported Tutorial Clinic. The application demonstrates complete student and admin workflows with centralized browser-persistent data. It intentionally has no backend, external database, or server-side authentication.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Verification

```bash
npm run typecheck
npm test
npm run test:mobile
npm run build
```

`npm run test:mobile` launches an installed Chrome, Edge, or Chromium browser headlessly and checks every student and admin route at 360 px, 390 px, and 768 px. It also verifies the mobile navigation sheet, notification panel, global search, QR dialog, note editor, and first-login setup modal. Screenshots and the JSON report are written to the operating system's temporary `tutorial-clinic-mobile-audit` directory.

## Presentation accounts

| Role | Name | Student ID |
|---|---|---|
| Student, first-login setup | Aria Mendoza | `2024-00421` |
| Contributor | Devon Reyes | `2023-00117` |
| Student | Sam Okafor | `2025-00208` |
| Contributor | Liam Park | `2022-00311` |
| Administrator | Nadia Cruz | `ADMIN-001` |

The login is a front-end simulation. Account setup details are stored locally and do not provide real security.

## Reset demo data

1. Sign in with `ADMIN-001`.
2. Open **Demo Controls** in the admin navigation.
3. Select **Restore seed data**.

The same page can clear app localStorage, clear IndexedDB note files, select a demo student, and simulate notifications or attendance.

## Browser storage

- localStorage key: `tutorial-clinic:demo:v1`
- IndexedDB database: `tutorial-clinic-files`
- IndexedDB object store: `noteFiles`

See [FRONTEND_DEMO_V1.md](./FRONTEND_DEMO_V1.md) for the implementation summary, prepared service boundary, and current limitations.

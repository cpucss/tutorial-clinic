# Tutorial Clinic backend implementation vault

Open this folder as an Obsidian vault, then begin with [[START HERE - Implementation Roadmap]] or [[Home]].

This handbook is tailored to the existing `cpucss/tutorial-clinic` React, Vite, and Supabase codebase. It contains:

- a codebase and website audit;
- a phased backend implementation program;
- Supabase Auth, schema, RLS, RPC, Storage, and testing guidance;
- a secure QR attendance design;
- a PWA and offline-sync implementation guide;
- staging and production execution runbooks;
- a review-first SQL migration pack under `Assets/SQL`.

The SQL files are implementation starters, not one-click production scripts. Run the preflight in a staging clone first, resolve every open decision, convert the reviewed SQL into version-controlled Supabase migrations, and execute each phase's verification gate before continuing.


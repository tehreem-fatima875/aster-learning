# Aster Learning

Aster Learning is a local full-stack Learning Management System demonstration. It includes a Next.js public site and role-based workspaces, an Express REST API, input validation, authentication, course workflows, learning progress, quiz grading, and certificates.

## Project structure

```text
.
├── Backend/
│   ├── src/
│   │   ├── app.ts                    # Express API, route wiring and error handling
│   │   ├── config/database.ts        # MongoDB connection, mode validation and readiness
│   │   ├── data/store.ts             # Explicit in-memory development adapter
│   │   ├── data/repository.ts        # Memory and MongoDB repositories
│   │   ├── models/index.ts           # Mongoose schemas and indexes
│   │   ├── services/                 # Demo seed data, progress and workflow rules
│   │   ├── types/domain.ts
│   │   └── server.ts
│   ├── .env.example
│   └── package.json
├── Frontend/
│   ├── src/app/                      # Next.js App Router public and portal screens
│   ├── src/components/               # Shared navigation, course cards and portal frame
│   ├── src/lib/api.ts                # Credentialed API client
│   └── .env.example
├── .gitignore
└── package.json
```

## Requirements

- Node.js 20 or newer and npm
- No MongoDB server or Atlas account is required for the included local-memory mode

## Install and run (PowerShell)

```powershell
npm.cmd install
npm.cmd run install:all
Copy-Item Backend\.env.example Backend\.env
Copy-Item Frontend\.env.example Frontend\.env.local
```

Edit `Backend\.env` and set `JWT_SECRET` to a unique random value of at least 32 characters. Keep `DATABASE_MODE=memory` for the local demo, or configure Atlas as described below. Then start both applications from the project root:

```powershell
npm.cmd run dev
```

Open `http://localhost:3000`. The API health check is at `http://localhost:4000/api/health`.

You may register as a learner or instructor. To enable the administrator workspace for local development, set **both** `ASTER_DEMO_ADMIN_EMAIL` and `ASTER_DEMO_ADMIN_PASSWORD` in `Backend\.env`; the password must be at least 12 characters. These variables are optional, and public registration cannot create an administrator. Do not use this demo bootstrap as a production provisioning mechanism.

## Connect MongoDB Atlas

1. In Atlas, allow the development machine's public IP in Network Access and give the database user the `readWrite` role on the intended application database.
2. Put the Atlas connection string in `Backend\.env` as `MONGODB_URI`. Replace the username, password, cluster host and database name with your own values; the database name in the URI path must match the database where the user has access (omitting it selects the default `test` database). URL-encode any reserved characters in the database password. Never put the real connection string in `.env.example`, frontend files, or source control.
3. Set `DATABASE_MODE=mongodb` and set `JWT_SECRET` to a unique random value of at least 32 characters.
4. Optionally set `SEED_DEMO_DATA=true` to seed the eight fictional courses and quiz data on startup. Seeding is idempotent and only inserts missing demo records. Alternatively, run `npm.cmd run seed --prefix Backend` to seed explicitly.
5. Start the backend and check `http://localhost:4000/api/health`. Startup also creates the required collections and indexes, so the database user must be allowed to create collections and indexes. Mongo mode reports `mongodb-connected` only after Mongoose establishes a connection; if unavailable, readiness returns HTTP 503 and `mongodb-disconnected`.

The MongoDB adapter reads and writes users, courses, enrollments, assessments, quiz attempts, certificates, bookmarks, password reset token hashes, and contact messages through Mongoose. Unique indexes protect email, course slug, enrollment, bookmark and certificate uniqueness. Mongo mode does not fall back to volatile memory if connection setup fails.

## Implemented features

- Responsive branded marketing home, course catalogue, search, category/level filters, sorting, course detail and free enrollment
- Account registration and sign-in with bcrypt password hashing, short-lived HTTP-only JWT cookies, role checks, auth rate limiting, CORS origin restriction, and same-site cookie settings
- Local-only password reset flow. In development, the reset link is shown on-screen; no email is sent
- Student workspace with enrolled courses, lesson completion/progress, saved courses, quiz-taking and attempt history, printable certificates, and a public certificate verification page
- Instructor workspace with course drafts, submission for review, assessment authoring, ownership checks, and enrollment/completion summaries
- Administrator overview, user search, and course approval/rejection endpoints and screens
- Server-validated assessment grading; correct answers are omitted from quiz delivery responses
- Server-issued certificates after all course lessons are completed; verification endpoint
- Mongoose schemas with timestamps, validation, references, and uniqueness indexes, ready for a persistence adapter
- Contact form validation, consistent JSON API errors, health endpoint, and focused unit tests for core workflows

## Environment variables

`Backend/.env`:

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default `4000`) |
| `FRONTEND_URL` | Allowed frontend origin for CORS and unsafe request origin checks |
| `DATABASE_MODE` | Explicitly `memory` or `mongodb` |
| `MONGODB_URI` | Required in MongoDB mode; Atlas or local MongoDB URI |
| `JWT_SECRET` | Required, at least 32 characters |
| `NODE_ENV` | `development` or `production`; secure cookie flag is enabled in production |
| `SEED_DEMO_DATA` | Set `true` to insert missing fictional demo courses during MongoDB startup |
| `ASTER_DEMO_ADMIN_EMAIL` | Optional local-only admin bootstrap email; use with the password variable |
| `ASTER_DEMO_ADMIN_PASSWORD` | Optional local-only admin bootstrap password, minimum 12 characters |

`Frontend/.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API base URL, default `http://localhost:4000/api` |

Never commit real `.env`/`.env.local` files or secrets.

## Seed data

Eight fictional professional courses and associated modules, lessons, instructors, and quizzes are loaded at startup in memory mode. In MongoDB mode, seed explicitly with `npm.cmd run seed --prefix Backend` or set `SEED_DEMO_DATA=true`. MongoDB seeding inserts missing records without overwriting existing data. There are no preset demo passwords or privileged accounts.

## Checks

```powershell
npm.cmd run test --prefix Backend
npm.cmd run build --prefix Backend
npm.cmd run build --prefix Frontend
```

## Limitations

- Memory mode remains volatile by design. Mongo mode requires valid Atlas credentials, network access, and configured indexes before use.
- Atlas credentials and access rules are the operator's responsibility. Use a least-privilege database user with `readWrite` on the intended database and an IP allow-list; do not commit `.env`.
- Email delivery, billing, lesson media hosting, complete curriculum authoring/reordering, admin account status controls, notification delivery, and production policy/legal review are not included. Courses are free; no payment is simulated.
- Email delivery, billing, lesson media hosting, complete curriculum authoring/reordering, admin account status controls, notification delivery, and production policy/legal review are not included. Courses are free; no payment is simulated.
- The seed catalog supplies fictional demo courses/instructors and text lesson content. No external video playback is represented as working.
- Contact messages persist in MongoDB mode and remain process-local in memory mode.

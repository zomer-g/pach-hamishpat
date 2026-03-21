# פח המשפט — Pach HaMishpat

A community-driven status reporting platform for Israel's court system (נט המשפט). Users can report system outages, view the current status, and read system announcements — all in real time.

**Live:** [https://pah.org.il/](https://pah.org.il/)

## Features

- **Real-time status dashboard** — green / orange / red indicators based on user reports
- **Community reporting** — anyone can submit a status report
- **System messages** — admin announcements with images and pinned messages
- **Comments** — community discussion on current system status
- **Admin panel** — protected admin area for managing content
- **RTL Hebrew UI** — fully right-to-left interface

## Tech Stack

- **Frontend:** React 18 + Vite, Tailwind CSS
- **Backend:** Express.js, sql.js (in-memory SQLite)
- **Deployment:** Render (free tier)

## Getting Started

```bash
# Install dependencies
npm install

# Run in development (frontend + backend concurrently)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `ADMIN_PASSWORD` | Admin login password | *(required)* |

## Project Structure

```
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── pages/            # Page components
│   ├── api/              # API client
│   └── lib/              # Auth context, utilities
├── server/               # Express backend
│   ├── routes/           # API route handlers
│   ├── db.js             # SQLite database setup
│   └── seed.js           # CSV data seeding
├── seed/                 # Base44 CSV data exports
└── render.yaml           # Render deployment blueprint
```

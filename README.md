# ClinicSaaS Frontend

React + Tailwind CSS frontend for multi-doctor clinic management system.

## Setup

```bash
npm install
npm run dev
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/          # Layout components (Header, Sidebar, Footer)
│   │   ├── ui/              # Reusable UI components (Button, Input, Card, etc.)
│   │   ├── Appointment/     # Appointment-specific components
│   ├── pages/               # Page components (Dashboard, Forms, etc.)
│   ├── routes/              # Route configuration
│   ├── services/            # API service (Axios)
│   ├── utils/               # Helper functions
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Features

- ✅ Routing (React Router v6)
- ✅ Tailwind CSS styling
- ✅ Reusable UI components
- ✅ Axios API service with interceptors
- ✅ Multi-tenant support (Patient/Doctor routes)
- ✅ Responsive layout
- ✅ Placeholder pages ready for API integration

## Next Phase

- Integrate real API endpoints
- Add form validation
- Implement authentication flow
- Add appointment management features
- Build prescription and report features

## API Configuration

API base URL is configured in `src/services/api.js`:

- Default: `http://localhost:5000/api`
- Can be overridden with `REACT_APP_API_URL` env variable

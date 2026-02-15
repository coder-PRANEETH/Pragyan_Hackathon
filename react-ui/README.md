# Medical Triage React UI

This is a React application built with Vite for the medical triage system.

## Features

- User Dashboard - View and search for patient information
- Create User - Add new patients to the system
- Real-time data fetching from backend API
- Modern, responsive UI with Tailwind CSS
- Interactive chat assistant
- Health metrics visualization

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend server running on http://localhost:5000

## Installation

The dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Running the Application

1. Make sure your backend server is running on port 5000
2. Start the development server:

```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:5173
```

## Available Routes

- `/` - User Dashboard (search and view patient data)
- `/create-user` - Create new patient form

## Project Structure

```
react-ui/
├── src/
│   ├── components/
│   │   ├── UserDashboard.jsx    # Main dashboard component
│   │   └── CreateUser.jsx       # Patient creation form
│   ├── styles/
│   │   ├── UserDashboard.css    # Dashboard styles
│   │   └── CreateUser.css       # Form styles
│   ├── App.jsx                  # Main app with routing
│   ├── App.css                  # App styles
│   ├── index.css                # Global styles
│   └── main.jsx                 # Entry point
├── package.json
└── vite.config.js
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Development

- Hot Module Replacement (HMR) is enabled - changes will reflect immediately
- ESLint is configured for code quality
- Vite provides fast dev server and optimized builds

## API Integration

The app connects to the backend API at `http://localhost:5000` with the following endpoints:

- `GET /user-details/:name` - Fetch user by name
- `POST /create-user` - Create new user

Make sure the backend is running before testing the app.


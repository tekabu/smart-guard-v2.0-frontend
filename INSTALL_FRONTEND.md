# Smart Guard Frontend Installation

## Prerequisites
- Docker and Docker Compose
- Git

## Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/tekabu/smart-guard-v2.0-frontend.git
cd smart-guard-v2.0-frontend
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

The `.env` file should contain:
```
# Laravel API URL
VITE_API_URL=http://localhost:8021

# Application Name
VITE_APP_NAME=SmartGuard

HOST_PORT=3001
```

### 3. Start the Application
```bash
docker compose -f docker-compose-dev.yml up -d
```

The frontend will be available at http://localhost:3001

## Configuration Notes
- Make sure the backend API is running on port 8021 (or adjust VITE_API_URL accordingly)
- The frontend runs on port 3001 by default (adjust HOST_PORT if needed)

## Development
For development with hot reload:
```bash
npm install
npm run dev
```
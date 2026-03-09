 WarMatrix

WarMatrix is a tactical simulation and command console application featuring a 3D tactical map interface, a scalable backend simulation engine, and an AI integration layer for an immersive operational dashboard.

## Tech Stack

### Frontend
- **Framework:** Next.js 15 (React 19)
- **Styling:** Tailwind CSS & Radix UI primitives
- **3D Graphics:** Three.js & React Three Fiber (@react-three/drei, @react-three/fiber)
- **State & Forms:** Zod, React Hook Form, Embla Carousel, Recharts

### Backend
- **Framework:** Python FastAPI (Uvicorn)
- **Engine:** Custom Python-based simulation engine (`backend/engine/`)

### AI Integration
- **Framework:** Firebase Genkit & Google GenAI (`@genkit-ai/google-genai`)

## Project Structure

- **`src/`**: Next.js frontend code including the App Router (`src/app/`), components, and client logic.
- **`backend/`**: Python API endpoints (`backend/api/`) and the core simulation engine (`backend/engine/`).
- **`ai_server/`**: Genkit AI processing and development utilities.
- **`scripts/`**: Development scripts and utilities (e.g., configuration for standalone backend/frontend dev servers).
- **`docs/`**: Additional project documentation.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Python](https://www.python.org/) (v3.10+)

### Installation

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Setup your Python virtual environment:**
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows, use: .\.venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

### Running the Application

The fastest way to start up the environment is to run the combined development script, which spans both the Next.js dev server and the Python FastAPI backend simultaneously:

```bash
npm run dev
```

If you need isolated environments, you can run the services individually:

- **Frontend (Next.js):**
  ```bash
  npm run dev:next
  ```
- **Backend (FastAPI):**
  ```bash
  npm run dev:backend
  ```
- **Genkit AI Server (Development):**
  ```bash
  npm run genkit:dev
  ```

## Common Scripts

- `npm run build`: Build the Next.js framework for production deployment.
- `npm run lint`: Run ESLint on the source repository.
- `npm run typecheck`: Execute the TypeScript compiler check for strict type validations.


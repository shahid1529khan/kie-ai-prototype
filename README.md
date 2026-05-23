# Kie.ai Generation Prototype

A full-stack React application for generating images and videos using the Kie.ai API.

## Requirements

1. **Supabase**: Create a new Postgres database in Supabase and run the schema inside `supabase/schema.sql`.
2. **Kie.ai API Key**: Needed to interface with Nano Banana and Kling 2.1 Pro models.
3. **Environment Setup**: Copy `.env.example` -> `.env.local` and populate the fields.

## Local Development

Install dependencies:
```bash
npm install
```

Start the application (Vite frontend + Express backend):
```bash
npm run dev
```

Navigate to `http://localhost:3000`.

## Features
- **Authentication**: JWT-based auth via server routes, storing users securely in Supabase.
- **Image Generation**: Full UI for submitting and polling images cleanly.
- **Video Generation**: Image-to-Video implementation with local file upload support to Kie.ai object storage.
- **History Viewer**: Logs every generation cost and tracks failures vs completions.
- **Admin Dashboard**: Aggregates all user spend accurately based on standard pricing.

## Architecture Decisions

This app uses a React Router SPA with an Express backend. The backend handles API key protection, database access, authentication, and generation workflows.

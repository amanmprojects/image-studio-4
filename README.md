# Image Studio 4 (Sunsetted)

An AI-powered image generation and organization studio built with Next.js, Google Vertex AI (Gemini), WorkOS AuthKit, and AWS.

## Features

- **AI Image Generation** – Generate high-quality images from text prompts using Gemini 2.5 Flash and Gemini 3 Pro.
- **Image Variations** – Create variations of existing images with adjustable similarity and custom prompts.
- **Advanced Organization** – Organize your studio with a nestable folder system.
- **Drag & Drop** – Seamlessly move images between folders using an intuitive drag-and-drop interface.
- **Secure Auth** – WorkOS AuthKit for hosted sign-in (email/password, social, SSO).
- **Cloud Storage** – Images stored in AWS S3 with cached presigned URLs for performance.
- **Gallery & Management** – View, download, move, and manage your generated creations.

## Supported Models

| Model | Provider | Label | Generation | Variation |
|-------|----------|-------|------------|-----------|
| Gemini 2.5 Flash | Google Vertex | Nano Banana 🍌 | ✅ | ✅ |
| Gemini 3 Pro | Google Vertex | Nano Banana Pro 🍌 | ✅ | ✅ |
| FLUX 1.1 Pro | Azure OpenAI | Flux Pro | (Optional) | ❌ |
| Amazon Titan v1 | AWS Bedrock | Titan G1 | (Optional) | ✅ |

*Note: Google Vertex AI models are currently the primary generation engine.*

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Auth**: WorkOS AuthKit
- **AI**: Google Generative AI SDK (Vertex AI) + Vercel AI SDK
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: AWS S3
- **Organization**: @dnd-kit for drag-and-drop folder management

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

Create a `.env` file in the root and fill in your values (refer to `src/lib/models/providers.ts` for logic):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g., `http://localhost:3000`) |
| `WORKOS_API_KEY` | WorkOS API key from dashboard |
| `WORKOS_CLIENT_ID` | WorkOS client ID |
| `WORKOS_COOKIE_PASSWORD` | 32+ character password for session encryption |
| `GOOGLE_API_KEY` | Google AI Studio API key (optional if using Vertex) |
| `GOOGLE_SERVICE_ACCOUNT_KEY`| Base64 encoded JSON service account key for Vertex AI |
| `GOOGLE_CLOUD_LOCATION` | Vertex AI location (e.g., `us-central1`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `AAWWSS_REGION` | AWS region for S3 (e.g., `us-east-1`) |
| `AAWWSS_ACCESS_KEY_ID` | AWS access key |
| `AAWWSS_SECRET_ACCESS_KEY` | AWS secret key |
| `S3_BUCKET_NAME` | S3 bucket name for image storage |

### 3. Configure WorkOS AuthKit

In the [WorkOS Dashboard](https://dashboard.workos.com):

1. Enable AuthKit in the Overview section
2. Go to **Redirects** and configure:
   - **Redirect URI**: `http://localhost:3000/api/auth/callback`
   - **Sign-in endpoint**: `http://localhost:3000/api/auth/login`
   - **Sign-out redirect**: `http://localhost:3000/`

### 4. Set up the database

Push the schema to your database:

```bash
bun run db:push
```

Or generate and run migrations:

```bash
bun run db:generate
bun run db:migrate
```

### 5. Configure AWS

**S3 Bucket**: Create an S3 bucket and ensure your IAM user has `PutObject` and `GetObject` permissions. Ensure CORS is configured for your app domain if serving thumbnails directly.

### 6. Configure Google Vertex AI

Ensure the Vertex AI API is enabled in your Google Cloud Project. If using a service account, grant it the "Vertex AI User" role.

## Development

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push schema to database |
| `bun run db:generate` | Generate migrations |
| `bun run db:migrate` | Run migrations |
| `bun run db:studio` | Open Drizzle Studio |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # WorkOS Auth routes
│   │   ├── folders/       # Folder CRUD operations
│   │   └── images/        # Image generation and management
│   ├── studio/            # Main application UI
│   │   ├── components/    # Studio-specific components (Gallery, Sidebar, Forms)
│   │   └── hooks/         # Custom React hooks for studio logic
│   ├── layout.tsx
│   └── page.tsx           # Marketing landing page
├── lib/
│   ├── api/               # API client and wrappers
│   ├── db/                # Drizzle schema and client
│   ├── models/            # Multi-provider AI model handlers (Gemini, Bedrock, etc.)
│   ├── s3.ts              # AWS S3 integration
│   └── workos.ts          # WorkOS configuration
└── ...
```

## License

MIT

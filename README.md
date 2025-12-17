# Image Studio

AI-powered image generation studio built with Next.js, OpenAI, WorkOS AuthKit, and AWS S3.

## Features

- **AI Image Generation** – Generate images from text prompts using OpenAI's gpt-image-1 model
- **Multiple Sizes** – Square (1024×1024), Portrait (1024×1792), Landscape (1792×1024)
- **Secure Auth** – WorkOS AuthKit for hosted sign-in (email/password, social, SSO)
- **Cloud Storage** – Images stored in AWS S3 with presigned URLs
- **Gallery** – View and manage your generated images

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Auth**: WorkOS AuthKit
- **AI**: OpenAI SDK
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: AWS S3

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g., `http://localhost:3000`) |
| `WORKOS_API_KEY` | WorkOS API key from dashboard |
| `WORKOS_CLIENT_ID` | WorkOS client ID |
| `WORKOS_COOKIE_PASSWORD` | 32+ character password for session encryption |
| `OPENAI_API_KEY` | OpenAI API key |
| `DATABASE_URL` | PostgreSQL connection string |
| `AAWWSS_REGION` | AWS region (e.g., `us-east-1`) |
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

### 5. Configure S3 bucket

Create an S3 bucket and ensure your IAM user has `PutObject` and `GetObject` permissions.

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
│   │   ├── auth/
│   │   │   ├── login/route.ts      # Redirects to WorkOS
│   │   │   ├── callback/route.ts   # Handles auth callback
│   │   │   └── logout/route.ts     # Signs out user
│   │   └── images/
│   │       ├── route.ts            # GET user's images
│   │       └── generate/route.ts   # POST generate new image
│   ├── studio/
│   │   └── page.tsx                # Protected studio UI
│   ├── layout.tsx
│   ├── page.tsx                    # Landing page
│   └── globals.css
└── lib/
    ├── db/
    │   ├── index.ts                # Drizzle client
    │   └── schema.ts               # DB schema
    ├── openai.ts                   # OpenAI client
    ├── s3.ts                       # S3 helpers
    └── workos.ts                   # WorkOS + session helpers
```

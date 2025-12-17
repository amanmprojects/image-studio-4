# Image Studio

AI-powered image generation and editing studio built with Next.js, Vercel AI SDK, WorkOS AuthKit, and AWS.

## Features

- **AI Image Generation** – Generate images from text prompts using multiple AI models
- **Image Variations** – Create variations of existing images with adjustable similarity
- **Multiple Providers** – Azure OpenAI (FLUX) and Amazon Bedrock (Titan, Nova Canvas)
- **Multiple Sizes** – Square (1024×1024), Portrait (1024×1440), Landscape (1440×1024)
- **Secure Auth** – WorkOS AuthKit for hosted sign-in (email/password, social, SSO)
- **Cloud Storage** – Images stored in AWS S3 with cached presigned URLs
- **Gallery** – View, download, and create variations of your generated images

## Supported Models

| Model | Provider | Generation | Variation |
|-------|----------|------------|-----------|
| FLUX 1.1 Pro | Azure OpenAI | ✅ | ❌ |
| Amazon Titan Image Generator v1 | AWS Bedrock | ✅ | ✅ |
| Amazon Nova Canvas | AWS Bedrock | ✅ | ✅ |

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Auth**: WorkOS AuthKit
- **AI**: Vercel AI SDK + AWS SDK for Bedrock
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
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL |
| `DATABASE_URL` | PostgreSQL connection string |
| `AAWWSS_REGION` | AWS region for S3 (e.g., `us-east-1`) |
| `AAWWSS_BEDROCK_REGION` | AWS region for Bedrock (e.g., `us-east-1`) |
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

**S3 Bucket**: Create an S3 bucket and ensure your IAM user has `PutObject` and `GetObject` permissions.

**Bedrock**: Enable the following models in the [Bedrock Console](https://console.aws.amazon.com/bedrock/):
- Amazon Titan Image Generator G1
- Amazon Nova Canvas

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
│   │       ├── generate/route.ts   # POST generate new image
│   │       ├── edit/route.ts       # POST create image variation
│   │       └── [id]/download/      # GET download image
│   ├── studio/
│   │   └── page.tsx                # Protected studio UI
│   ├── layout.tsx
│   ├── page.tsx                    # Landing page
│   └── globals.css
└── lib/
    ├── db/
    │   ├── index.ts                # Drizzle client
    │   └── schema.ts               # DB schema
    ├── ai.ts                       # AI SDK + Bedrock clients
    ├── models.ts                   # Model configurations
    ├── s3.ts                       # S3 helpers
    └── workos.ts                   # WorkOS + session helpers
```

## License

MIT

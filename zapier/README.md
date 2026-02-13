# Creator Studio Zapier Integration

This directory contains the Zapier integration for Creator Studio, enabling users to automate workflows with 6,000+ apps.

## Structure

```
zapier/
├── package.json           # Zapier platform dependencies
├── index.js              # Main app definition
├── authentication.js     # API key auth configuration
├── triggers/             # Event triggers
│   ├── post-created.js      # New post created trigger
│   └── export-completed.js  # Export completed trigger
└── creates/              # Actions
    ├── create-post.js       # Create social post action
    └── upload-image.js      # Upload image action (stub)
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Zapier CLI globally:
```bash
npm install -g zapier-platform-cli
```

3. Login to Zapier:
```bash
zapier login
```

4. Register the app:
```bash
zapier register "Creator Studio"
```

5. Push to Zapier:
```bash
zapier push
```

## Testing

Run tests locally:
```bash
zapier test
```

## Triggers

### New Post Created
Polls `/v1/zapier/posts/recent` for recently created social media posts.

**Output Fields:**
- Post ID, content, platform, status
- Published date, platform post ID
- Media URLs

### Export Completed
Polls `/v1/zapier/exports/recent` for completed canvas/video exports.

**Output Fields:**
- Export ID, type, format
- Download URL, completion date
- Metadata

## Actions

### Create Social Post
Creates a new post via `POST /v1/posts`.

**Input Fields:**
- Social account ID
- Content (text)
- Media URLs (comma-separated)
- Schedule date (optional)

### Upload Image
Uploads image via `POST /v1/images` (stub implementation).

**Input Fields:**
- Image URL
- File name (optional)

## Authentication

Uses Bearer token authentication. Users generate API keys in Creator Studio settings.

**Test endpoint:** `GET /v1/auth/verify`

## API Endpoints Required

The following Creator Studio API endpoints must be implemented:

- `GET /v1/auth/verify` - Verify API key
- `GET /v1/zapier/posts/recent` - List recent posts
- `GET /v1/zapier/exports/recent` - List recent exports
- `POST /v1/posts` - Create new post
- `POST /v1/images` - Upload image (stub)

## Development

To modify triggers or actions:

1. Edit files in `triggers/` or `creates/`
2. Test locally: `zapier test`
3. Push updates: `zapier push`
4. Increment version in package.json

## Production Deployment

1. Test thoroughly in Zapier developer console
2. Submit for review via Zapier dashboard
3. Address any feedback from Zapier team
4. Publish to public Zapier marketplace

## Notes

- Image upload is stubbed - implement with cloud storage (S3, Cloudflare R2, etc.)
- Polling intervals default to 15 minutes (Zapier standard)
- API endpoints return JSON with consistent error handling
- Rate limiting: 100 requests/minute per API key recommended

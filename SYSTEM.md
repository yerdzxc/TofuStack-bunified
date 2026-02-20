# TofuStack System Architecture

## Overview

TofuStack is a Bun-native full-stack web application with SvelteKit frontend and Hono API.

## Infrastructure

### Database

- **PostgreSQL** - Main relational database
- **DragonflyDB** - Redis-compatible in-memory store (sessions, caching, rate limiting)

### Storage

- **S3-Compatible** - Uses Bun's native S3 client
  - Supports AWS S3, Cloudflare R2, Backblaze, MinIO, Garage, and more
  - See [docs/STORAGE.md](./docs/STORAGE.md) for configuration guide

## Dependencies

### Bun-Native Packages

| Package               | Usage            | Location              |
| --------------------- | ---------------- | --------------------- |
| `Bun.password`        | Password hashing | `hashing.service.ts`  |
| `crypto.randomUUID()` | ID generation    | `crypto.ts`           |
| `bun:Redis`           | Redis client     | `redis.service.ts`    |
| `bun:S3Client`        | S3 storage       | `storage.service.ts`  |
| Native `Date`         | Date handling    | `sessions.service.ts` |

### Third-Party Packages

| Package             | Purpose                       |
| ------------------- | ----------------------------- |
| `hono`              | API framework                 |
| `hono-rate-limiter` | Rate limiting                 |
| `rate-limit-redis`  | Redis store for rate limiting |
| `drizzle`           | SQL query builder             |
| `@napi-rs/image`    | Image processing              |
| `@needle-di/core`   | Dependency injection          |

## Scripts

### Docker Setup

```bash
# Start all services
docker compose up -d

# Setup Garage (run after first start)
./docker/setup-garage.sh
```

### Testing

```bash
# Test S3 upload
bun ./scripts/test/test-s3.ts
```

## API Endpoints

### Health

- `GET /api/healthz` - Health check

### Rate Limiting

- `GET /api/rate-limit` - Test endpoint (3 requests/minute)

## Environment Variables

### Storage (Garage)

```
STORAGE_HOST=localhost
STORAGE_PORT=3900
STORAGE_ACCESS_KEY=<generated>
STORAGE_SECRET_KEY=<generated>
STORAGE_BUCKET=dev
```

### Database

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
```

### Redis

```
REDIS_URL=redis://localhost:6379
```

## Known Issues / Workarounds

1. **rate-limit-redis + Bun**: Requires wrapper to adapt to Bun's RedisClient API:

   ```typescript
   sendCommand: (command: string, ...args: string[]) => {
   	return redisClient.send(command, args);
   };
   ```

2. **Bun S3Client**: Uses filesystem-like API (`.write()`, `.unlink()`) instead of AWS SDK commands

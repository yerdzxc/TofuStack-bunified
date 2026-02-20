# Storage (S3-Compatible)

TofuStack uses Bun's native S3 client, supporting **any S3-compatible storage** provider.

## Supported Providers

| Provider                     | Example Configuration              |
| ---------------------------- | ---------------------------------- |
| AWS S3                       | [See below](#aws-s3)               |
| Cloudflare R2                | [See below](#cloudflare-r2)        |
| Backblaze B2                 | [See below](#backblaze-b2)         |
| MinIO                        | [See below](#minio)                |
| Garage                       | [See below](#garage)               |
| Wasabi                       | [See below](#wasabi)               |
| DigitalOcean Spaces          | [See below](#digitalocean-spaces)  |
| Google Cloud Storage         | [See below](#google-cloud-storage) |
| Azure Blob Storage (Azurite) | [See below](#azure-blob-storage)   |

## Environment Variables

```env
# Required
STORAGE_HOST=localhost
STORAGE_ACCESS_KEY=your_access_key
STORAGE_SECRET_KEY=your_secret_key
STORAGE_BUCKET=your_bucket_name

# Optional
STORAGE_PORT=443           # Default: 443 for HTTPS
STORAGE_REGION=auto        # Default: auto
STORAGE_URL_STYLE=virtual  # virtual | path (Default: virtual)
STORAGE_FORCE_PATH_STYLE=true  # true | false (Default: true for MinIO/Garage)
```

### Variable Details

| Variable                   | Description                                                 | Default   |
| -------------------------- | ----------------------------------------------------------- | --------- |
| `STORAGE_HOST`             | S3 endpoint hostname                                        | -         |
| `STORAGE_PORT`             | S3 endpoint port                                            | `443`     |
| `STORAGE_REGION`           | Provider region                                             | `auto`    |
| `STORAGE_ACCESS_KEY`       | Access key ID                                               | -         |
| `STORAGE_SECRET_KEY`       | Secret access key                                           | -         |
| `STORAGE_BUCKET`           | Bucket name                                                 | `dev`     |
| `STORAGE_URL_STYLE`        | URL format: `virtual` (bucket.host) or `path` (host/bucket) | `virtual` |
| `STORAGE_FORCE_PATH_STYLE` | Use path-style URLs                                         | `true`    |

---

## Provider Examples

### AWS S3

```env
STORAGE_HOST=s3.amazonaws.com
STORAGE_PORT=443
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
STORAGE_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STORAGE_BUCKET=my-bucket
STORAGE_URL_STYLE=virtual
STORAGE_FORCE_PATH_STYLE=false
```

### Cloudflare R2

```env
STORAGE_HOST=your-account.r2.cloudflarestorage.com
STORAGE_PORT=443
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=your_access_key
STORAGE_SECRET_KEY=your_secret_key
STORAGE_BUCKET=my-bucket
STORAGE_URL_STYLE=virtual
STORAGE_FORCE_PATH_STYLE=false
```

> **Tip:** R2 doesn't charge egress fees - great for hosting assets!

### Backblaze B2

```env
STORAGE_HOST=s3.us-west-002.backblazeb2.com
STORAGE_PORT=443
STORAGE_REGION=us-west-002
STORAGE_ACCESS_KEY=your_access_key
STORAGE_SECRET_KEY=your_secret_key
STORAGE_BUCKET=my-bucket
STORAGE_URL_STYLE=virtual
STORAGE_FORCE_PATH_STYLE=false
```

### MinIO

```env
STORAGE_HOST=localhost
STORAGE_PORT=9000
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=my-bucket
STORAGE_URL_STYLE=path
STORAGE_FORCE_PATH_STYLE=true
```

### Garage

```env
STORAGE_HOST=localhost
STORAGE_PORT=3900
STORAGE_REGION=garage
STORAGE_ACCESS_KEY=your_access_key
STORAGE_SECRET_KEY=your_secret_key
STORAGE_BUCKET=my-bucket
STORAGE_URL_STYLE=path
STORAGE_FORCE_PATH_STYLE=true
```

### Wasabi

```env
STORAGE_HOST=s3.wasabisys.com
STORAGE_PORT=443
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=your_access_key
STORAGE_SECRET_KEY=your_secret_key
STORAGE_BUCKET=my-bucket
STORAGE_URL_STYLE=virtual
STORAGE_FORCE_PATH_STYLE=false
```

### DigitalOcean Spaces

```env
STORAGE_HOST=nyc3.digitaloceanspaces.com
STORAGE_PORT=443
STORAGE_REGION=nyc3
STORAGE_ACCESS_KEY=your_access_key
STORAGE_SECRET_KEY=your_secret_key
STORAGE_BUCKET=my-bucket
STORAGE_URL_STYLE=virtual
STORAGE_FORCE_PATH_STYLE=false
```

### Google Cloud Storage

```env
STORAGE_HOST=storage.googleapis.com
STORAGE_PORT=443
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=your_access_key
STORAGE_SECRET_KEY=your_secret_key
STORAGE_BUCKET=my-bucket
STORAGE_URL_STYLE=virtual
STORAGE_FORCE_PATH_STYLE=false
```

### Azure Blob Storage (Azurite)

```env
STORAGE_HOST=localhost
STORAGE_PORT=10000
STORAGE_REGION=default
STORAGE_ACCESS_KEY=your_account_name
STORAGE_SECRET_KEY=your_account_key
STORAGE_BUCKET=my-container
STORAGE_URL_STYLE=path
STORAGE_FORCE_PATH_STYLE=true
```

---

## Local Development with Garage

The project includes Garage (S3-compatible) in Docker Compose:

```bash
# Start services
docker compose up -d

# Setup Garage (generates keys)
docker exec tofustack-bunified-garage-1 /garage -c /etc/garage.toml key create tofustack
docker exec tofustack-bunified-garage-1 /garage -c /etc/garage.toml bucket create dev
docker exec tofustack-bunified-garage-1 /garage -c /etc/garage.toml bucket allow dev --key tofustack --read --write --owner
```

Or use the setup script:

```bash
bash docker/setup-garage.sh
```

---

## Testing S3 Connection

```bash
# Run the S3 test script
bun run scripts/test/test-s3.ts
```

Expected output:

```
🧪 Testing S3 upload...

Config: { ENDPOINT: "localhost", BUCKET: "dev" }
   Uploading test-1234567890.txt...
   ✅ Upload successful!
   Downloading test-1234567890.txt...
   Downloaded: Hello from TofuStack!
   Deleting test-1234567890.txt...
   ✅ Deleted!

✅ S3 upload working!
```

---

## Image Processing

The storage service uses `@napi-rs/image` for image transformations:

- Resize images on upload
- Convert between formats (PNG, JPEG, WebP, AVIF)
- Automatic format detection

Image processing uses the uploaded file's content type to determine output format.

# Image Upload Pipeline with Signed URLs

This document describes the image upload pipeline implemented for article images using signed URLs and cloud storage (AWS S3 compatible).

## Overview

The upload pipeline provides:
- **Secure uploads** via signed URLs (no direct access keys needed)
- **Mobile camera support** via Capacitor Camera plugin
- **File picker support** for web and mobile gallery
- **Automatic image validation** (type, size, dimensions)
- **Progress tracking** during uploads
- **S3-compatible storage** (works with AWS S3, DigitalOcean Spaces, MinIO, etc.)

## Architecture

### Components

1. **Storage Utility** (`lib/storage-upload.ts`)
   - Handles upload logic
   - Gets signed URLs from API
   - Uploads files to storage
   - Validates images

2. **API Routes**
   - `/api/upload/signed-url` - Generates signed upload URLs
   - `/api/upload/download-url` - Generates signed download URLs (for private files)

3. **Image Upload Component** (`components/image-upload.tsx`)
   - Camera capture (mobile via Capacitor)
   - File picker (web and mobile gallery)
   - Upload progress
   - Preview and error handling

4. **Form Integration**
   - `blog-form.tsx` - Blog post cover images
   - `wiki-form.tsx` - Wiki article cover images

## Setup

### Environment Variables

Create a `.env.local` file with:

```env
# Required
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# Optional: AWS credentials (if not using IAM roles)
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Optional: Custom S3-compatible endpoint (e.g., DigitalOcean Spaces)
AWS_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Optional: Public CDN URL for uploaded images
AWS_S3_PUBLIC_URL=https://cdn.yourdomain.com
```

### AWS S3 Configuration

1. Create an S3 bucket (or use existing)
2. Configure bucket CORS policy:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["PUT", "GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

3. Configure bucket policy for public reads (if needed):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## Usage

### Basic Usage

```tsx
import { ImageUpload } from "@/components/image-upload"

<ImageUpload
  onUploadComplete={(result) => {
    console.log("Uploaded:", result.url)
    // result contains: url, width, height, size, mimeType
  }}
  onError={(error) => {
    console.error("Upload failed:", error)
  }}
  folder="articles/cover"
  maxSize={10 * 1024 * 1024} // 10MB
/>
```

### With Existing Image

```tsx
<ImageUpload
  existingImageUrl="https://example.com/image.jpg"
  onRemove={() => {
    // Handle image removal
  }}
  onUploadComplete={handleUpload}
/>
```

### Camera Support

On mobile devices, the component automatically shows a "Camera" button that uses the Capacitor Camera plugin. On web, it falls back to file picker.

## API

### `uploadImage(file: File, folder?: string): Promise<ImageUploadResult>`

Uploads an image file to storage.

**Parameters:**
- `file`: The image file to upload
- `folder`: Storage folder path (default: "articles")

**Returns:**
```typescript
{
  url: string        // Final URL of uploaded image
  width: number     // Image width in pixels
  height: number    // Image height in pixels
  size: number      // File size in bytes
  mimeType: string  // MIME type (e.g., "image/jpeg")
}
```

### `getSignedUploadUrl(fileName, fileType, fileSize, folder?): Promise<SignedUploadUrlResponse>`

Gets a signed URL for uploading a file.

### `getSignedDownloadUrl(fileUrl): Promise<string>`

Gets a signed URL for downloading a private file.

## File Organization

Files are organized in storage with the following structure:
```
bucket/
  articles/
    cover/
      1234567890-abc123.jpg
  wiki/
    cover/
      1234567890-xyz789.jpg
```

File names include:
- Timestamp for uniqueness
- Random string for collision prevention
- Original file extension

## Validation

The upload pipeline validates:
- **File type**: Must be an image (image/*)
- **File size**: Maximum 10MB (configurable)
- **Dimensions**: Blog posts require minimum 1280x720px with 16:9 aspect ratio

## Error Handling

Errors are handled at multiple levels:
1. Client-side validation (before upload)
2. API validation (signed URL generation)
3. Upload errors (network, storage issues)

All errors are passed to the `onError` callback with descriptive messages.

## Testing

Run tests with:
```bash
pnpm test lib/__tests__/storage-upload.test.ts
pnpm test app/api/upload/__tests__/
pnpm test components/__tests__/image-upload.test.tsx
```

## Mobile Integration

The upload component uses Capacitor Camera plugin for native camera access on mobile:

```typescript
import { Camera } from "@capacitor/camera"
import { Capacitor } from "@capacitor/core"

if (Capacitor.isNativePlatform()) {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: "base64",
  })
  // Convert and upload...
}
```

## Security Considerations

1. **Signed URLs**: Files are uploaded via signed URLs, not direct access keys
2. **URL Expiration**: Signed URLs expire after 1 hour
3. **File Validation**: Server-side validation prevents malicious uploads
4. **Size Limits**: Maximum file size prevents abuse
5. **Type Validation**: Only image types are accepted

## Troubleshooting

### Upload Fails
- Check AWS credentials and bucket permissions
- Verify CORS configuration
- Check network connectivity
- Review browser console for errors

### Camera Not Working
- Ensure Capacitor is properly configured
- Check device permissions (camera access)
- Verify @capacitor/camera is installed

### Signed URL Generation Fails
- Verify environment variables are set
- Check AWS credentials
- Ensure bucket exists and is accessible


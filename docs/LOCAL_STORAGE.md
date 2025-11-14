# Local File Storage Setup

This project is configured to use local filesystem storage instead of AWS S3 or other external services.

## Configuration

In your `.env` file:
```env
USE_LOCAL_STORAGE=true
```

## How It Works

1. **Upload Endpoint**: Files are uploaded to `/api/upload/local`
2. **Storage Location**: Files are saved to `public/uploads/{folder}/`
3. **Public Access**: Files are accessible at `/uploads/{folder}/{filename}`

## Directory Structure

```
public/
  uploads/
    articles/       # Article cover images
    videos/         # Video uploads
    profiles/       # Profile photos
    pets/          # Pet photos
```

## File Organization

Uploaded files are automatically named with:
- Timestamp for uniqueness
- Random string for collision prevention
- Original sanitized filename

Example: `1699999999999-abc123-my-image.jpg`

## Validation

The system validates:
- **File type**: Images (10MB max) and videos (100MB max)
- **Allowed types**: image/*, video/*
- **Automatic directory creation**: Folders are created as needed

## Development

Files uploaded during development are stored locally and ignored by git (see `.gitignore`).

## Production Considerations

For production, consider:
- Using a CDN or cloud storage (AWS S3, DigitalOcean Spaces, etc.)
- Implementing file cleanup/rotation policies
- Adding image optimization and resizing
- Setting up proper backup strategies

To switch to cloud storage, set `USE_LOCAL_STORAGE=false` and configure AWS credentials in `.env`.

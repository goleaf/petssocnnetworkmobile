# Local Upload Setup - Quick Start

## ✅ What's Been Fixed

1. **Local storage configured** - No AWS/S3 required
2. **Upload API created** - `/api/upload/local` handles file uploads
3. **Storage location** - Files saved to `public/uploads/`
4. **Auto-detection** - System detects localhost and uses local storage
5. **Initialization errors fixed** - All React component errors resolved

## 🚀 How to Test

### Option 1: Simple HTML Test Page
1. Start your dev server: `npm run dev`
2. Open: http://localhost:3000/test-upload.html
3. Select an image and click "Upload Image"
4. You should see the uploaded image displayed

### Option 2: Test API Endpoint
```bash
# Check if upload API is working
curl http://localhost:3000/api/upload/test
```

Should return:
```json
{
  "status": "ok",
  "useLocalStorage": true,
  "message": "Upload API is working"
}
```

### Option 3: Use Your Application
1. Navigate to the page with the cover image upload
2. Click "Upload" or "Choose Image"
3. Select an image file
4. The image will be uploaded to `public/uploads/articles/`
5. The image will be accessible at `/uploads/articles/filename.jpg`

## 📁 File Structure

```
public/
  uploads/
    articles/      # Article cover images
    test/          # Test uploads
    videos/        # Video uploads
    pets/          # Pet photos
```

## 🔧 Configuration

Your `.env` file:
```env
DATABASE_URL="file:./dev.db"
USE_LOCAL_STORAGE=true
```

## 🐛 Troubleshooting

### Upload fails with "Failed to get signed upload URL"
- Make sure `USE_LOCAL_STORAGE=true` is in your `.env`
- Restart your dev server after changing `.env`

### Files not appearing
- Check `public/uploads/` directory exists
- Check browser console for errors
- Verify the API endpoint: http://localhost:3000/api/upload/test

### Permission errors
- Ensure the `public/uploads/` directory is writable
- On Windows, check folder permissions

## 📝 How It Works

1. **Client** uploads file via FormData to `/api/upload/local`
2. **Server** saves file to `public/uploads/{folder}/`
3. **Returns** public URL like `/uploads/articles/123456-abc.jpg`
4. **Browser** can access the file directly from the public folder

## 🎯 Next Steps

Once upload works:
- Try uploading a cover image in your application
- Check the `public/uploads/` folder to see the saved files
- Images are immediately accessible via their URLs

## 💡 Production Note

For production, you'll want to:
- Set `USE_LOCAL_STORAGE=false`
- Configure AWS S3 or another cloud storage
- See `docs/IMAGE_UPLOAD.md` for cloud setup

# Security Setup Instructions

## Important: Database Credentials

The MongoDB connection credentials have been moved to environment variables for security.

### First Time Setup

1. **Copy the example files:**
   ```bash
   cp config.env.example config.env
   cp mongodb.example.js mongodb.js
   ```

2. **Update config.env with your actual credentials:**
   - Open `config.env`
   - Replace the example values with your real MongoDB credentials
   - **NEVER commit this file to git**

3. **Change MongoDB Password:**
   - Go to MongoDB Atlas dashboard: https://cloud.mongodb.com/
   - Navigate to Database Access
   - Edit the user `2301104852_db_user` and change the password
   - Update the new password in your `config.env` file

### Security Checklist

- ✅ `config.env` is in `.gitignore`
- ✅ `mongodb.js` is in `.gitignore`
- ✅ `drive_credentials.json` is in `.gitignore`
- ⚠️ **CHANGE YOUR MONGODB PASSWORD** - it was exposed in git history
- 🔒 Enable IP whitelist in MongoDB Atlas
- 🔒 Use strong, unique passwords
- 🔒 Rotate credentials regularly

### What's Protected

These files are now excluded from git:
- `server/config.env` - Environment variables with credentials
- `server/mongodb.js` - Database connection file
- `server/drive_credentials.json` - Google Drive API credentials

### For Developers

Never commit:
- Passwords or API keys
- Database connection strings with credentials
- Service account keys
- Access tokens

Always use environment variables for sensitive data.

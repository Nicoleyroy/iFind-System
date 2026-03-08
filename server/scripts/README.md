# Server Utility Scripts

This folder contains utility scripts for various maintenance and administration tasks.

## Available Scripts

### makeAdmin.js
Promotes a user to admin role.

**Usage:**
```bash
node scripts/makeAdmin.js
```

### check-user.js
Checks if a user exists in the database and displays user information.

**Usage:**
```bash
node scripts/check-user.js
```

### reset-password-manual.js
Manually resets a user's password (hardcoded email and password for emergency recovery).

**Usage:**
```bash
node scripts/reset-password-manual.js
```

### setup-test-email.js
Creates a test email account on Ethereal (fake SMTP service) for development testing.

**Usage:**
```bash
node scripts/setup-test-email.js
```

## Notes
- These scripts connect directly to the database using environment variables or hardcoded connection strings
- Run these scripts from the server root directory: `node scripts/<script-name>.js`
- Ensure your `.env` file is properly configured before running

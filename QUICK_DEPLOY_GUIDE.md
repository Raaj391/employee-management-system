# Quick Deployment Guide - Employee Management System

## Download the Code
1. From Replit, select all files in the file explorer
2. Right-click and select "Download" to save them

## Upload to Your Server
1. Upload all files to your web server
2. Make sure you have Node.js 16+ installed

## Set Up Database
1. Create a PostgreSQL database
2. Note: database name, username, password, host, port

## Quick Setup Commands
Run these commands on your server:

```bash
# Install dependencies
npm install

# Create .env file
echo "PORT=5000
NODE_ENV=production
SESSION_SECRET=your_secure_random_string
DATABASE_URL=postgres://username:password@hostname:port/database" > .env

# Initialize database
npm run db:push

# Build for production
npm run build

# Start the application
npm start
```

## Access Your Website
1. Go to your domain or IP address
2. Log in with:
   - Username: admin
   - Password: admin123
3. IMPORTANT: Change the default password immediately!

## Troubleshooting
- Database issues: Check your DATABASE_URL in .env
- App won't start: Make sure port 5000 is available
- Can't log in: Verify database setup was successful
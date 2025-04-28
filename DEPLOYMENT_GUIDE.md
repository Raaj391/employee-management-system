# Employee Management System - Deployment Guide

This guide provides comprehensive instructions for exporting and deploying the Employee Management System application on your own server.

## Prerequisites

Before you begin, ensure your server has the following:

- **Node.js** (version 20.x recommended)
- **npm** (Node Package Manager)
- **PostgreSQL** database (version 14.x or later)
- A Linux-based operating system (Ubuntu/Debian recommended)

## Step 1: Export the Code

### Option 1: Download ZIP from Replit
1. Click on the three dots (...) in the upper right corner of the Replit interface
2. Select "Download as ZIP"
3. Save the ZIP file to your local machine

### Option 2: Clone via Git
If Replit provides a Git URL, you can:
```bash
git clone <your-replit-git-url>
```

## Step 2: Prepare Your Server

1. **Update your server**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Node.js (if not already installed)**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Verify installation**
   ```bash
   node -v  # Should show v20.x.x
   npm -v   # Should show 9.x.x or later
   ```

4. **Install PostgreSQL (if not already installed)**
   ```bash
   sudo apt install postgresql postgresql-contrib -y
   ```

5. **Start PostgreSQL service**
   ```bash
   sudo systemctl start postgresql.service
   sudo systemctl enable postgresql.service
   ```

## Step 3: Set Up PostgreSQL Database

1. **Create a PostgreSQL user and database**
   ```bash
   sudo -u postgres psql -c "CREATE USER employeeadmin WITH PASSWORD 'your_secure_password';"
   sudo -u postgres psql -c "CREATE DATABASE employeedb;"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE employeedb TO employeeadmin;"
   sudo -u postgres psql -c "ALTER USER employeeadmin WITH SUPERUSER;"
   ```

2. **Note down the database connection details**:
   - Database: `employeedb`
   - Username: `employeeadmin`
   - Password: `your_secure_password`
   - Host: `localhost` (or your server IP)
   - Port: `5432` (default PostgreSQL port)

## Step 4: Upload and Configure the Application

1. **Transfer the project files to your server**
   - Using SCP:
     ```bash
     scp -r ./employee-management-system user@your-server-ip:/path/to/destination
     ```
   - Or upload the ZIP file and extract it

2. **Navigate to the project directory**
   ```bash
   cd /path/to/destination
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create environment file**
   Create a `.env` file in the project root with the following content:
   ```
   PORT=5000
   NODE_ENV=production
   SESSION_SECRET=your_secure_random_string
   DATABASE_URL=postgres://employeeadmin:your_secure_password@localhost:5432/employeedb
   ```

## Step 5: Database Migration

1. **Push the database schema**
   ```bash
   npm run db:push
   ```

## Step 6: Build and Start the Application

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the application**
   ```bash
   npm start
   ```

3. **For production use, set up PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   pm2 start npm --name "employee-management" -- start
   pm2 save
   pm2 startup
   ```

## Step 7: Configure Web Server (Optional but Recommended)

For production deployments, it's recommended to set up a reverse proxy with Nginx:

1. **Install Nginx**
   ```bash
   sudo apt install nginx -y
   ```

2. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/employee-management
   ```

3. **Add the following configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;  # Replace with your domain or server IP
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable the site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/employee-management /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **Set up SSL with Let's Encrypt (recommended)**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d your-domain.com
   ```

## Step 8: Access Your Application

1. **Via direct port**:
   - `http://your-server-ip:5000`

2. **Via domain (if configured)**:
   - `https://your-domain.com`

## Initial Login

The system creates a default admin account:
- Username: `admin`
- Password: `admin123`

**Important:** Change the default admin password immediately after your first login.

## Troubleshooting

1. **Database Connection Issues**
   - Verify your DATABASE_URL environment variable
   - Ensure PostgreSQL is running: `sudo systemctl status postgresql`
   - Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-14-main.log`

2. **Application Not Starting**
   - Check application logs: `pm2 logs employee-management`
   - Verify Node.js version: `node -v`
   - Ensure all dependencies are installed: `npm install`

3. **Nginx/SSL Issues**
   - Check Nginx configuration: `sudo nginx -t`
   - Verify Nginx logs: `sudo tail -f /var/log/nginx/error.log`

## Maintenance and Updates

1. **Backing up your database**
   ```bash
   pg_dump -U employeeadmin -d employeedb > employeedb_backup_$(date +%Y%m%d).sql
   ```

2. **Updating the application**
   ```bash
   git pull  # If using Git
   npm install
   npm run build
   pm2 restart employee-management
   ```

## Security Recommendations

1. **Firewall Setup**
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

2. **Regular Updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   npm audit fix
   ```

3. **Database Security**
   - Regularly change PostgreSQL user passwords
   - Configure PostgreSQL to only listen on localhost if not accessed remotely

4. **Application Security**
   - Change the SESSION_SECRET periodically
   - Implement IP-based rate limiting for the login endpoint
   - Set up regular data backups
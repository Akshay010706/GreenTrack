# GreenTrack Deployment Guide

## Issues Fixed

1. **Service Worker Path Issue**: Fixed service worker registration to use relative paths
2. **Landing Page Navigation**: Fixed circular link to properly navigate to main app
3. **Service Worker Cache**: Updated cache paths to include all necessary files
4. **PWA Manifest**: Fixed start URL to point to main app

## Pre-deployment Setup

### 1. Supabase Configuration

Your Supabase project is already configured with:
- URL: `https://ncbqpmlwqernubikpcry.supabase.co`
- Anonymous key is already in the code

Make sure your Supabase database has the required tables by running the migrations:

```sql
-- Already in your migrations folder:
-- 0001_create_reports_table.sql
-- 0002_create_leaderboard_table.sql  
-- 0003_create_facilities_table.sql
-- 0004_seed_facilities_table.sql
```

### 2. Environment Variables

For Netlify deployment, set these environment variables in your Netlify dashboard:

```
SUPABASE_URL=https://ncbqpmlwqernubikpcry.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Deployment Options

### Option 1: Netlify (Recommended)

1. **Via GitHub (Recommended)**:
   ```bash
   # Initialize git repository
   git init
   git add .
   git commit -m "Initial commit"
   
   # Create repository on GitHub and push
   git branch -M main
   git remote add origin https://github.com/yourusername/greentrack.git
   git push -u origin main
   ```

   Then connect to Netlify via GitHub integration.

2. **Direct Deploy**:
   - Install Netlify CLI: `npm install -g netlify-cli`
   - Login: `netlify login`
   - Deploy: `netlify deploy --prod --dir=GreenTrack`

### Option 2: Vercel

```bash
npm install -g vercel
vercel --prod
```

### Option 3: GitHub Pages

1. Push to GitHub repository
2. Enable GitHub Pages in repository settings
3. Set source to main branch

## File Structure

```
GreenTrack/
├── index.html          # Landing page
├── ma1n.html          # Main application
├── manifest.json      # PWA manifest
├── netlify.toml       # Netlify configuration
├── sw.js             # Service worker
├── styles.css        # Main styles
├── landing.css       # Landing page styles
└── js/               # JavaScript modules
    ├── main.js       # Main application logic
    ├── auth.js       # Authentication
    ├── db.js         # Local database
    ├── supabase-client.js  # Supabase integration
    └── ... other modules
```

## Testing Before Deployment

1. **Local Testing**:
   ```bash
   # Serve locally (Python 3)
   python -m http.server 8000
   
   # Or with Node.js
   npx serve .
   ```

2. **Test PWA Features**:
   - Service worker registration
   - Offline functionality
   - App manifest

## Post-Deployment

1. **Test all user flows**:
   - Landing page → Main app navigation
   - Login with demo accounts
   - Training modules
   - Waste reporting
   - Map functionality
   - Admin dashboard

2. **Verify PWA features**:
   - Install prompt
   - Offline functionality
   - Service worker updates

3. **Check Supabase integration**:
   - Data persistence
   - Real-time updates (if implemented)

## Demo Accounts

```
Admin:   admin@demo   / 1234
Worker:  worker@demo  / 1234  
Citizen: citizen@demo / 1234
```

## Troubleshooting

### Common Issues:

1. **Service Worker not loading**: Check network tab for 404 errors
2. **PWA not installing**: Verify manifest.json and HTTPS
3. **Supabase errors**: Check environment variables and API keys
4. **Module loading errors**: Verify all import/export statements

### Logs to Check:
- Browser console for JavaScript errors
- Network tab for failed requests
- Netlify function logs for backend issues

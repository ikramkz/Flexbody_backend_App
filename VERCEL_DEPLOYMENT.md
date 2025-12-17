# Vercel Deployment Guide - FlexBody Backend

## 🔧 Fixing MongoDB Connection Issues on Vercel

### Problem
The error `Operation sessions.find() buffering timed out after 10000ms` occurs because:
1. MongoDB connection is not optimized for serverless environments
2. Environment variables (MONGO_URI) may not be set in Vercel
3. MongoDB Atlas may need IP whitelisting for Vercel IPs

### Solution Applied
✅ Updated `server.js` with:
- Serverless-optimized MongoDB connection (connection caching)
- Better error handling
- Connection pooling for serverless
- Proper export for Vercel serverless functions

---

## 📋 Step-by-Step Vercel Deployment

### Step 1: Set Environment Variables in Vercel

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add the following environment variable:**
   - **Name**: `MONGO_URI`
   - **Value**: Your MongoDB connection string
     ```
     mongodb+srv://username:password@cluster.mongodb.net/flexbody?retryWrites=true&w=majority
     ```
   - **Environment**: Production, Preview, Development (select all)

3. **Optional Environment Variables:**
   - **Name**: `NODE_ENV`
   - **Value**: `production`
   - **Environment**: Production

### Step 2: Configure MongoDB Atlas for Vercel

1. **Go to MongoDB Atlas Dashboard** → Network Access

2. **Add IP Address:**
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - **OR** Add specific Vercel IP ranges (not recommended, as Vercel uses dynamic IPs)

3. **Verify Database User:**
   - Go to Database Access
   - Ensure your database user has proper permissions
   - Username and password should match your MONGO_URI

### Step 3: Deploy to Vercel

#### Option A: Via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: (leave empty or `npm install`)
   - **Output Directory**: (leave empty)
5. Add environment variables (from Step 1)
6. Click "Deploy"

#### Option B: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add MONGO_URI
# Paste your MongoDB connection string when prompted

# Deploy to production
vercel --prod
```

### Step 4: Verify Deployment

1. **Check Deployment Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on the latest deployment
   - Check "Build Logs" for any errors

2. **Test Health Endpoint:**
   ```
   GET https://your-project.vercel.app/health
   ```
   Should return:
   ```json
   {
     "status": "OK",
     "database": "connected",
     "timestamp": "2024-..."
   }
   ```

3. **Test API Endpoint:**
   ```
   GET https://your-project.vercel.app/api/all-sessions
   ```

---

## 🔍 Troubleshooting

### Issue: "MONGO_URI environment variable is not set"

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Ensure `MONGO_URI` is set for the correct environment (Production/Preview/Development)
3. Redeploy after adding environment variables

### Issue: "MongoDB connection timeout"

**Solutions:**
1. **Check MongoDB Atlas Network Access:**
   - Ensure IP whitelist includes `0.0.0.0/0` (all IPs)
   - Or add Vercel's IP ranges

2. **Verify Connection String:**
   - Check username and password are correct
   - Ensure cluster name is correct
   - Verify database name in connection string

3. **Check MongoDB Atlas Status:**
   - Ensure cluster is running (not paused)
   - Check if you've exceeded free tier limits

### Issue: "Operation buffering timed out"

**Solutions:**
1. **Connection String Options:**
   Add these parameters to your MONGO_URI:
   ```
   mongodb+srv://user:pass@cluster.mongodb.net/flexbody?retryWrites=true&w=majority&serverSelectionTimeoutMS=5000&socketTimeoutMS=45000
   ```

2. **Check MongoDB Atlas Cluster:**
   - Ensure cluster is in the same region as Vercel (or close)
   - Check cluster performance metrics

3. **Verify Database User Permissions:**
   - User should have read/write permissions
   - Check Database Access in MongoDB Atlas

### Issue: API returns 500 error

**Check Vercel Function Logs:**
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on the function that's failing
3. Check "Logs" tab for error messages

---

## ✅ Verification Checklist

- [ ] Environment variable `MONGO_URI` is set in Vercel
- [ ] MongoDB Atlas Network Access allows `0.0.0.0/0/0` or Vercel IPs
- [ ] Database user has correct permissions
- [ ] MongoDB cluster is running (not paused)
- [ ] Connection string format is correct
- [ ] Health endpoint returns `"database": "connected"`
- [ ] API endpoints are accessible

---

## 🔗 Testing Your API

### Health Check
```bash
curl https://flexbodybackendapi.vercel.app/health
```

### Get All Sessions
```bash
curl https://flexbodybackendapi.vercel.app/api/all-sessions
```

### Save Session (POST)
```bash
curl -X POST https://flexbodybackendapi.vercel.app/api/save-session \
  -H "Content-Type: application/json" \
  -d '{
    "patient_first_name": "John",
    "patient_last_name": "Doe",
    "patient_mobile_no": "1234567890",
    "exercise_type": "sit and reach",
    "totalScore": "96.67",
    "duration": "02:40"
  }'
```

---

## 📝 Important Notes

1. **Serverless Functions:**
   - Vercel uses serverless functions, so each request may use a new instance
   - Connection caching is implemented to reuse connections
   - Cold starts may cause initial requests to be slower

2. **Environment Variables:**
   - Must be set in Vercel Dashboard
   - Changes require redeployment
   - Different values can be set for Production/Preview/Development

3. **MongoDB Atlas:**
   - Free tier (M0) is sufficient for development
   - For production, consider M10+ cluster
   - Monitor usage to avoid exceeding limits

4. **Connection String Format:**
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

---

## 🚀 Quick Deploy Command

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variable (if not already set)
vercel env add MONGO_URI production
```

---

**After deployment, your API should be accessible at:**
`https://flexbodybackendapi.vercel.app/api/all-sessions`

If you still encounter issues, check the Vercel function logs for detailed error messages.


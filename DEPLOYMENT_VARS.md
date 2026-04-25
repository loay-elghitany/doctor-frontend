# Deployment Environment Variables Guide

This guide provides the exact environment variables needed for deploying the Doctor Frontend (Vercel) and Backend (Render) with the custom domain `mydoc90.com`.

## 🚨 Critical: Production Configuration

**Before deploying, you MUST set these environment variables. The application will fail without them.**

---

## Frontend (Vercel) Environment Variables

Add these variables in your Vercel project settings under **Settings → Environment Variables**.

### ⚠️ Critical Warning: Variable Name Must Be Exact

**The variable MUST be named `VITE_API_BASE_URL` (not `VITE_API_URL`).**  
If you use the wrong name, the application will fail silently and may return HTML/CSS instead of JSON data.

### Required Variables

| Variable            | Production Value                        | Description                                                  |
| ------------------- | --------------------------------------- | ------------------------------------------------------------ |
| `VITE_API_BASE_URL` | `https://your-backend.onrender.com/api` | **CRITICAL**: Your Render backend URL with `/api` suffix     |
| `VITE_MAIN_DOMAIN`  | `mydoc90.com`                           | **CRITICAL**: Your custom domain (without www or subdomains) |

### Optional Variables

| Variable                        | Example Value     | Description                            |
| ------------------------------- | ----------------- | -------------------------------------- |
| `VITE_CLOUDINARY_CLOUD_NAME`    | `your_cloud_name` | Cloudinary cloud name for file uploads |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `your_preset`     | Unsigned upload preset from Cloudinary |

### Example Vercel Configuration

```
VITE_API_BASE_URL=https://doctor-backend-xyz.onrender.com/api
VITE_MAIN_DOMAIN=mydoc90.com
VITE_CLOUDINARY_CLOUD_NAME=demo
VITE_CLOUDINARY_UPLOAD_PRESET=doctor_uploads
```

### How to Add Variables in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Click **Add Environment Variable**
4. Enter the variable name and value
5. Select **Production** environment
6. Click **Save**
7. **Redeploy** your application for changes to take effect

---

## Backend (Render) Environment Variables

Add these variables in your Render service settings under **Environment**.

### Required Variables

| Variable               | Example Value                                                       | Description                                                             |
| ---------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `NODE_ENV`             | `production`                                                        | Set to production                                                       |
| `MONGO_URI`            | `mongodb+srv://...`                                                 | MongoDB Atlas connection string                                         |
| `JWT_SECRET`           | `your_jwt_secret_here`                                              | Secret key for JWT tokens (generate a strong random string)             |
| `ADMIN_SECRET_TOKEN`   | `your_admin_secret`                                                 | Secret for admin authentication                                         |
| `CORS_ALLOWED_ORIGINS` | `https://mydoc90.com,https://www.mydoc90.com,https://*.mydoc90.com` | **CRITICAL**: Comma-separated list of allowed frontend origins          |
| `MAIN_DOMAIN`          | `mydoc90.com`                                                       | **CRITICAL**: Your custom domain (must match frontend VITE_MAIN_DOMAIN) |

### Optional Variables

| Variable                         | Example Value | Description                                  |
| -------------------------------- | ------------- | -------------------------------------------- |
| `DEBUG`                          | `false`       | Set to false in production                   |
| `PORT`                           | `5000`        | Port number (Render sets this automatically) |
| `WHATSAPP_NOTIFICATIONS_ENABLED` | `false`       | Enable WhatsApp notifications                |

### Example Render Configuration

```
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/doctor_db
JWT_SECRET=your_super_secret_jwt_key_generate_with_openssl_rand_hex_64
ADMIN_SECRET_TOKEN=sha256_hash_of_your_admin_secret
CORS_ALLOWED_ORIGINS=https://mydoc90.com,https://www.mydoc90.com,https://*.mydoc90.com
MAIN_DOMAIN=mydoc90.com
DEBUG=false
```

### How to Add Variables in Render

1. Go to your Render service dashboard
2. Click **Environment** tab
3. Click **Add Environment Variable**
4. Enter the variable name and value
5. Click **Save Changes**
6. **Redeploy** your service for changes to take effect

---

## 🔍 Verification Steps After Deployment

### 1. Check Frontend Console Logs

After deploying to Vercel, open your browser's developer console and navigate to your production URL. You should see:

```
=== PRODUCTION ENVIRONMENT DETECTED ===
Current hostname: mydoc90.com
Target API URL: https://your-backend.onrender.com/api
Main domain: mydoc90.com
Protocol: https:
=======================================
```

**If you see "NOT SET" for any variable, the environment variables are not configured correctly.**

### 2. Test Subdomain Routing

Visit a subdomain like `test.mydoc90.com` and check the console. The application should:

- Detect the subdomain correctly
- Make API calls to the correct backend

### 3. Verify CORS Configuration

If you see CORS errors in the console, check:

- `CORS_ALLOWED_ORIGINS` in Render includes all your frontend domains
- `MAIN_DOMAIN` in Render matches your frontend's `VITE_MAIN_DOMAIN`

---

## 🛠 Common Issues & Solutions

### Issue: "Unable to load profile" or API connection errors

**Cause**: `VITE_API_BASE_URL` is missing or incorrect

**Solution**:

1. Verify the variable is set in Vercel
2. Ensure it includes `/api` at the end
3. Check that your Render backend is running

### Issue: CORS errors

**Cause**: Mismatch between frontend domain and backend CORS settings

**Solution**:

1. Add all frontend variations to `CORS_ALLOWED_ORIGINS`:
   - `https://mydoc90.com`
   - `https://www.mydoc90.com`
   - `https://*.mydoc90.com` (for subdomains)
2. Ensure `MAIN_DOMAIN` is set to `mydoc90.com` (without www)

### Issue: Subdomain detection not working

**Cause**: `VITE_MAIN_DOMAIN` is missing or incorrect

**Solution**:

1. Set `VITE_MAIN_DOMAIN=mydoc90.com` in Vercel
2. Redeploy the frontend
3. Clear browser cache

### Issue: Cookies not working for authentication

**Cause**: `withCredentials` not enabled or CORS not configured properly

**Solution**:

1. Ensure `withCredentials: true` is set in API config (already done)
2. Verify `credentials: true` in backend CORS options (already done)
3. Check that your domain setup allows cross-subdomain cookies

---

## 📝 Checklist Before Production Deployment

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Custom domain `mydoc90.com` configured in Vercel
- [ ] `VITE_API_BASE_URL` set in Vercel (with `/api` suffix)
- [ ] `VITE_MAIN_DOMAIN` set in Vercel to `mydoc90.com`
- [ ] `CORS_ALLOWED_ORIGINS` set in Render to include all frontend variations
- [ ] `MAIN_DOMAIN` set in Render to `mydoc90.com`
- [ ] MongoDB Atlas connection string configured
- [ ] JWT_SECRET generated and configured
- [ ] Both services redeployed after environment variable changes
- [ ] Browser console shows correct configuration in production logs

---

## 🔄 Updating Environment Variables

Whenever you update environment variables:

1. **Vercel**: Go to Settings → Environment Variables, update, then redeploy
2. **Render**: Go to Environment tab, update, then redeploy

**Important**: Changes only take effect after a new deployment.

---

## 📧 Support

If you continue experiencing issues:

1. Check browser console for detailed error messages
2. Review Vercel function logs in the dashboard
3. Review Render service logs
4. Verify all environment variables are set correctly
5. Ensure your custom domain DNS is properly configured

---

**Last Updated**: 2026-04-25  
**Domain**: mydoc90.com  
**Frontend**: Vercel  
**Backend**: Render

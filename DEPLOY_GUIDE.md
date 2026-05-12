# HuaHinWatch - Deployment Guide

## ✅ STATUS: Code is ready!

All files have been prepared and are ready to upload to GitHub.

---

## 🚀 NEXT STEPS (Do these now):

### Step 1: Upload code to GitHub
You have two options:

**Option A: Easy (Recommended)**
```bash
# Copy-paste in terminal:
git clone https://github.com/LausSzecsi/huahinwatch
cd huahinwatch
npm install
```

**Option B: Upload manually**
- Go to your GitHub repo: https://github.com/LausSzecsi/huahinwatch
- Click "Add file" → "Upload files"
- Upload all these files:
  - package.json
  - src/App.jsx
  - src/index.jsx
  - src/index.css
  - public/index.html
  - README.md
  - .gitignore
  - vercel.json

### Step 2: Deploy to Vercel

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Click "New Project"**
3. **Select your GitHub repo**: `huahinwatch`
4. **Click "Deploy"** (takes 2-3 minutes)
5. **You get a URL** like: `huahinwatch.vercel.app`

### Step 3: Connect your domain

1. **In Vercel**: Go to "Settings" → "Domains"
2. **Add domain**: `huahinwatch.com`
3. **Update DNS** in Simply.com:
   - Go to your domain settings
   - Add Vercel nameservers:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ```
4. **Wait 24 hours** for DNS to propagate
5. **LIVE!** 🎉

---

## 📊 What's included:

✅ React 18 app
✅ Real OpenWeatherMap API (free!)
✅ Responsive design
✅ Dark theme with brutalist aesthetics
✅ Live camera feeds (ITAC)
✅ Power outage alerts
✅ Traffic conditions
✅ Weather widget with real-time data

---

## 🔧 If you want to customize:

**Colors**: Edit the hex codes in App.jsx (all styles are inline)
**Logo/Title**: Change "HUA HIN WATCH" in the header
**Locations**: Add/remove webcams in the `webcams` array
**API data**: Open-Meteo is already integrated!

---

## 🆘 Troubleshooting:

**"Module not found"**
- Run: `npm install`

**"Port 3000 in use"**
- Run: `npm start -- --port 3001`

**Deploy takes long**
- Normal! First deploy takes 2-3 min. Next ones are faster.

**Domain not working**
- Wait 24 hours for DNS to propagate
- Check nameservers are correct in Simply.com

---

## 📞 Need help?

All files are ready. Just upload to GitHub and deploy! 

Your domain: **huahinwatch.com**
Vercel will give you a preview URL in 2-3 minutes.

---

**Let me know when you're ready to go!** 🚀

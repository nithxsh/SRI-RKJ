# Shri Namo Narayanaya Astrology Platform 🔮

A professional, mobile-optimized Vedic Astrology platform built with React, Firebase, and Gemini AI.

## ✨ Key Features
- **AI "First Look" Horoscope**: Instant preliminary readings using Google Gemini 2.0.
- **Booking Management**: Admin portal for verified consultations and slot booking.
- **Automated Reminders**: Browser notifications sent 15 minutes before consultations.
- **Official Receipts**: PDF/Print-ready verification documents for seekers.
- **PWA Ready**: Installable on Android and iOS devices.

## 🛠️ Setup Instructions

### 1. Environment Variables
Copy the example environment file and fill in your keys:
```bash
cp .env.example .env.local
```
Fill in the following in `.env.local`:
- `VITE_FIREBASE_*`: Your Firebase project credentials.
- `VITE_GEMINI_API_KEY`: Your API key from Google AI Studio.
- `VITE_EMAILJS_*`: Your EmailJS service and template IDs.

### 2. Service Worker Verification
To enable background notifications, you must manually update the config in `public/firebase-messaging-sw.js` with your Firebase keys. 
> [!IMPORTANT]
> This file is sanitized for GitHub security. Do not push your actual keys to public repositories.

### 3. Installation
```bash
npm install
npm run dev
```

## 🚀 Pushing to GitHub
This project is sanitized for public sharing. To push your own version:
1. Create a new repository on GitHub.
2. Run the following commands:
```bash
git init
git add .
git commit -m "Initialize sanitized project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## 📜 License
Private/Proprietary - Shri Namo Narayanaya Astrology Office.

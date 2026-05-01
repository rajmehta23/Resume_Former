# ✨ Resume Former: Design Your Future

**The ultimate AI-powered resume builder for the modern career landscape.**

Live App: [https://rajmehta23.github.io/Resume_Former/](https://rajmehta23.github.io/Resume_Former/)

---

## 🚀 Overview

**Resume Former** is more than just a template—it's a smart career assistant designed to help you stand out. Whether you're a student building your first profile or a seasoned professional looking for an "Executive" look, this app creates polished, high-authority resumes in minutes.

### Why use Resume Former?

*   **Intelligence Engine**: Our built-in AI helps you improve your summaries, suggests technical skills, and even writes impactful bullet points for your education and projects.
*   **Design-First Templates**: Choose from several distinctive themes including **Executive**, **Neo-Tech**, **Zenith**, and **Modern UX**.
*   **Live Preview**: See your changes in real-time on a pixel-perfect A4 sheet representation.
*   **One-Click Export**: Download a professional, high-quality PDF ready for any job portal.
*   **Local Privacy**: Your data is saved locally in your browser, keeping your personal information private while you work.

---

## 💡 Key Features

- **Biometric Profile Upload**: Add a high-resolution headshot to your profile.
- **Smart Analytics**: Get a "Resume Authority" score that tells you exactly how strong your profile is and what to add next.
- **Automated Enhancements**: Turn simple descriptions into high-impact professional statements with the "Enhance with AI" button.
- **Technical Matrix**: Organically categorize your skills into Frontend, Backend, Database, Cloud, and more.
- **Responsive Controls**: Effortlessly switch between themes to see which visual style fits your persona best.

---

## 🛠️ Tech Stack

*   **Frontend**: React + TypeScript
*   **Styling**: Tailwind CSS
*   **Animations**: Framer Motion
*   **Intelligence**: Google Gemini AI
*   **Graphics**: Three.js (for the immersive background)
*   **PDF Engine**: html2canvas + jsPDF

---

## 🔑 AI Configuration (Fixing "AI not working")

If you have deployed this to GitHub Pages and the AI features (Improve Text, Suggest Skills, etc.) are not working, follow these steps:

### 1. The Easy Way (Device-Specific)
Click the **Settings (gear icon)** in the top navigation bar of the app and paste your **Gemini API Key**. This will save the key in your browser's local storage and enable AI features immediately for that device.

### 2. The Permanent Way (For everyone)
To make the AI work for everyone visiting your site, you must add your Gemini API Key to your GitHub repository:
1.  Go to your repository on GitHub.
2.  Navigate to **Settings** > **Secrets and variables** > **Actions**.
3.  Click **New repository secret**.
4.  Name: `GEMINI_API_KEY`
5.  Value: Paste your Gemini API Key (get one from [Google AI Studio](https://aistudio.google.com/app/apikey)).
6.  Go to the **Actions** tab and re-run your latest deployment workflow.

*Note: For security reasons, using a GitHub Secret will bake the key into your public frontend bundle. Only do this if you are comfortable with your key being accessible via browser developer tools.*

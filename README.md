# 🏆 Crunch Showdown (July 4th Chip Voting App)

An interactive, heated-rivalry themed chip voting web application designed for a Fourth of July party. Built with **React**, **TypeScript**, **Tailwind CSS (v4)**, and **shadcn/ui**.

Live URL: **[https://JoeFromDenver.github.io/chips/](https://JoeFromDenver.github.io/chips/)**

---

## 🌟 Key Features

* **🇺🇸 July 4th Thematic Design**: High-contrast dark mode with neon red/blue glowing accents, ambient fireworks effects, and responsive cards.
* **🗳️ Multi-Voting Category Showdown**: Guests can vote as many times as they want in four distinct categories:
  * 👑 **Grand Champion** (Best Overall)
  * 🔥 **Spiciest Challenger**
  * 🌀 **Weirdest Wonder** (Unique/Weird)
  * 📉 **Least Best** (Disaster)
* **🥔 Chip Profile Photos**: Shows actual, cropped photos of the 9 chips in the competition, making it easy to identify bags at a glance.
* **📝 Corporate Anecdote**: Highlighted details including the legendary story of how the Trader Joe's Carolina Gold BBQ Chips were suggested to corporate by employees at the Boulder, CO store!
* **🔥 Real-time Firestore Sync**: Syncs guest votes instantly to the host's TV screen using a modular Cloud Firestore layout.
* **🛡️ OLED TV Protection (Pixel Saver)**:
  * **Ambient Motion**: Slow-moving canvas floating particles keep background pixels active.
  * **Layout Rotation**: Automatically swaps between vertical progress bars (**Layout A**) and grid comparisons (**Layout B**) every 10 minutes.
  * **Pixel Shifter**: Gently shifts the layout by 1–2 pixels every 30 seconds to prevent outline ghosting.
  * **Victory Podium**: Ends voting with a dramatic pedestal transition and looping virtual confetti fireworks!
* **📴 Offline QR Tally Fallback**: In case of poor connectivity, guests can generate a summary QR code of their local votes. The host scans it using their camera scanner (equipped with a synthesized cashier success beep) to tally votes completely offline.
* **🔓 Password Protection**: Gated entry using the password `syrup` and a chosen username to keep guest sessions organized and prevent random public access.

---

## 🚀 Running Locally

This project uses a local, self-contained portable Node.js environment to run Vite and compile tailwind.

1. **Start the local Dev Server**:
   ```bash
   export PATH="./.node/bin:$PATH"
   npm run dev
   ```
2. Open [http://localhost:5173/](http://localhost:5173/) in your browser.
3. Enter `syrup` as the password and choose a username.

---

## ☁️ Real-time Firestore Configuration

To use the live sync board, hosts can paste their Firebase Configuration directly in the app's **Database Settings** panel (accessed via the ⚙️ cog in the welcome screen). The settings are saved in the browser's `localStorage` so that no API keys are hardcoded in public source control!

To set up Firestore rules, configure your database as follows:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /parties/{partyCode}/userVotes/{username} {
      allow read, write: if true;
    }
  }
}
```

---

## 🛠️ Tech Stack

* **Core**: React, TypeScript, Vite
* **Styling**: Tailwind CSS v4, Lucide Icons, Canvas-Confetti
* **Components**: shadcn/ui (Base UI theme)
* **Database**: Firebase Cloud Firestore
* **QR Tech**: html5-qrcode, qrcode


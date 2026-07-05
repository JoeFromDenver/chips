# 🎨 Crunch Showdown - Custom Assets Wishlist

This wishlist tracks custom visual assets that can be added to the project to elevate the party theme and visual polish. Place completed assets in the specified folder paths, and the app will load them!

---

## 📽️ Video Loops

### 1. Host Dashboard Background Video
* **Purpose**: Replaces the canvas particle backdrop on the host's TV screen with a high-fidelity ambient loop. Must be dark to protect OLED pixels.
* **Suggested Visuals**: Abstract dark fireworks, slow-drifting colored dust particles, or glowing neon sparks.
* **Specifications**:
  * **Format**: `.mp4` (encoded using H.264/AAC for browser compatibility)
  * **Resolution**: `1920x1080` (1080p) or `3840x2160` (4K)
  * **Aspect Ratio**: `16:9`
  * **Duration**: 10–20 seconds (seamlessly loopable)
  * **File Size**: Target < 10MB (for fast loading)
* **Destination Path**: `public/assets/videos/dashboard-bg.mp4`

### 2. Victory Celebration Backdrop
* **Purpose**: Plays full-screen behind the champion podium once the host ends the voting and crowns the winners.
* **Suggested Visuals**: Loopable gold confetti showers, exploding vibrant fireworks, or spinning 3D victory trophies.
* **Specifications**:
  * **Format**: `.mp4` (H.264/AAC)
  * **Resolution**: `1920x1080`
  * **Duration**: 5–10 seconds (seamlessly loopable)
  * **File Size**: Target < 5MB
* **Destination Path**: `public/assets/videos/victory-bg.mp4`

---

## 🖼️ Static Graphics

### 3. Lock Screen Hero Logo / Illustration
* **Purpose**: Displayed at the top of the **Password Gate** screen (where users enter the password `syrup`). This sets the initial "Showdown" aesthetic.
* **Suggested Visuals**: Two stylized chips colliding in a splash of flames/sparks with bold "CRUNCH SHOWDOWN" text.
* **Specifications**:
  * **Format**: `.webp` or `.png` (with transparency)
  * **Size**: `800x800` pixels (square ratio)
  * **Aspect**: Transparent backdrop, clean outlines
* **Destination Path**: `src/assets/hero-logo.webp` (or `.png`)

### 4. Custom Chip Challenger Cards
* **Purpose**: Custom border overlays or card designs that make each chip look like a selection fighter in a video game screen.
* **Suggested Visuals**: Glow effects, styled margins, or individual illustrations of the bags in character art.
* **Specifications**:
  * **Format**: `.webp` or `.png` (with transparency)
  * **Size**: `400x550` pixels
* **Destination Path**: `public/assets/chips/[chip-id]-card.png`

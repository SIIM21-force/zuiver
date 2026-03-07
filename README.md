<div align="center">
  <img src="public/icon.png" alt="Klank App Icon" width="100" height="100" />
  <br />
  <img src="public/logo.png" alt="Klank Logo Full" width="350" />
  <h1>Klank</h1>
  <p>An offline, visually immersive music player built with Electron, React, and TypeScript.</p>
</div>

![Klank Hero Image](docs/hero-screenshot.png) <!-- Add a high-quality screenshot of the UI playing a song here -->

## ✨ Features

- **Offline Library Management:** Add local folders and manage your `.mp3`, `.wav`, `.flac`, `.ogg`, and `.m4a` files.
- **Immersive Visualizer:** Stunning audio visualizations using `butterchurn` (MilkDrop clone) reacting in real-time to your music.
- **Audio Recognition:** Embedded Shazam API (`node-shazam`) to identify unknown tracks directly within the app.
- **Dynamic UI:** A beautiful, responsive interface featuring dynamic coloring, blur effects, and smooth animations.
- **Metadata Parsing:** Automatically extracts embedded album art, titles, and artists from local files using `music-metadata`.

## 📸 See it in Action

### Visualizer
![Visualizer](docs/visualizer.gif) 

### Shazam Recognition
![Shazam Feature](docs/shazam.gif)

## 🛠️ Tech Stack

This project is separated into two main environments:

*   **Frontend (`src/`)**: React 18, TypeScript, TailwindCSS (or vanilla CSS), Zustand (state management), Butterchurn (visualizer).
*   **Backend (`electron/`)**: Electron 30, Node.js APIs (fs, path), node-shazam, music-metadata.

> For a deep dive into how these layers work, check out the [Frontend README](src/README.md) and [Backend README](electron/README.md).

## 🚀 Development Setup (How to Contribute)

We welcome pull requests! If you want to add new features, fix bugs, or improve the visualizations, follow these steps to get your local development environment running:

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- Git

### 1. Fork & Clone
First, fork this repository to your own GitHub account. Then, clone it locally:
```bash
git clone https://github.com/your-username/klank.git
cd klank
```

### 2. Install Dependencies
Install all required packages for both the React frontend and Electron backend:
```bash
npm install
```

### 3. Run the App in Development Mode
Start the Vite development server and spawn the Electron window simultaneously:
```bash
npm run dev
```
*Note: The app runs with Hot Module Replacement (HMR). Any changes you make to the React components (`src/`) will instantly reflect in the Electron window without needing a restart.*

### 4. Making a Pull Request
1. Create a new branch for your feature: `git checkout -b feature/my-cool-feature`
2. Make your code changes.
3. Commit your changes: `git commit -m "Add some cool feature"`
4. Push to your fork: `git push origin feature/my-cool-feature`
5. Open a Pull Request on this main repository!

---

## 📦 Building for Production (Windows)

To compile an executable `.exe` installer for Windows to test your changes in a production environment:

```bash
npm run build
```

The resulting installer (`Klank Setup 1.0.0.exe`) will be located in the `release/` directory.

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**. 

By contributing to this repository, you agree that your contributions will be licensed under its GPL-3.0 license. For more information, please see the [LICENSE](LICENSE) file.

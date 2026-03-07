# Frontend (`src/`)

This directory contains the entire React 18 application that serves as the user interface for Klank. It is bundled using Vite for rapid development and optimized production builds.

## Architecture & State Management

### Zustand (`store/`)
We use [zustand](https://github.com/pmndrs/zustand) for lightweight, global state management. The store handles:
- **Audio State**: Playing, paused, current time, volume, and playback speed.
- **Queue System**: The current playlist, previous tracks, and next tracks.
- **Library Data**: The parsed list of local songs with their metadata (titles, artists, and base64 artwork).

### The Player Engine (`components/Player/`)
The core functionality lives here. 
- A hidden `<audio>` element acts as the source of truth for playback. 
- The React components sync their state to the `audio` element's native events (e.g., `onTimeUpdate`, `onEnded`).

### The Visualizer (`butterchurn`)
Klank features immersive audio representations using `butterchurn` (a WebGL implementation of the classic Winamp MilkDrop visualizer).
- We route the output of the `<audio>` element through a Web Audio API `AnalyserNode`.
- The frequency data from the analyser is fed into `butterchurn` to render the visuals onto a `<canvas>` element in real-time.

### Inter-Process Communication (IPC)
Because the frontend runs in a secure browser environment (the renderer process), it cannot directly access the local file system or run heavy Node.js scripts. 

Instead, it asks the Electron backend to do these things using `window.ipcRenderer`. See `types/global.d.ts` for the type definitions of our exposed IPC API.

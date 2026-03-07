# Backend (`electron/`)

This directory contains the Node.js code that runs the native side of the application (the Main Process). 

Because Electron applications run a secure Chromium browser for the UI, the frontend cannot directly interact with the operating system. The code in this folder acts as a bridge, listening for events from the frontend and performing native tasks on its behalf.

## `main.ts`

This is the entry point for the Electron application. It is responsible for:
1.  **Window Management**: Bootstrapping the `BrowserWindow`, setting its dimensions, hiding the default OS frame for a custom UI, and loading the Vite dev server (in development) or the static HTML files (in production).
2.  **IPC Handlers (Inter-Process Communication)**: Establishing the API that the React frontend uses to interact with the OS.

### Key IPC Handlers

- **`dialog:openFiles` & `dialog:openFolder`**: Opens native Windows file explorer dialogs so the user can select audio files or directories to add to their library.
- **`fs:readFile`**: Reads the raw binary data of a track from the disk, so the frontend can create a Blob URL to feed into the `<audio>` element.
- **`metadata:parse`**: Uses `music-metadata` to read the ID3 tags of an audio file. This extracts the title, artist, duration, and embedded cover art picture, which is then serialized to a `base64` string for the frontend to render as an `<img>`.
- **`shazam:recognize`**: Executes the `node-shazam` API. It takes a local file path, generates an audio fingerprint, and queries Shazam's servers to identify unknown tracks, returning the found metadata back to React.

## `preload.ts`

This script runs just before the React frontend loads. It bridges the gap between the Main process and the Renderer process safely. 

It uses `contextBridge.exposeInMainWorld` to attach specific functions to the global `window` object in the browser. This ensures the React app can call `window.ipcRenderer.invoke('metadata:parse', path)` securely without exposing the entire Node.js `require` ecosystem to the frontend.

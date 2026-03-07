# Music Player with Logarithmic Bar Spectrum Visualizer

## 1. Project Overview

The goal is to develop a locally-installed desktop music player with a polished, highly-functional user interface. The core feature set includes high-fidelity logarithmic bar spectrum visualization, automated metadata retrieval for local files missing ID3 tags, and a robust alternative visualization system using MilkDrop V2.

---

## 2. Core Features

### Audio Playback & Analysis

- Reads and plays local audio files (MP3, WAV, FLAC).
- Utilizes a low-latency framework for audio processing and visualization data extraction.

### Core Visualizations

- **Logarithmic Bar Spectrum:** Converts standard linear frequency data into a logarithmic scale to accurately reflect human hearing, rendering a dynamic bar graph.
- **MilkDrop V2 (Alternative):** Integrates the Butterchurn visualizer engine to provide users with classic, high-performance WebGL visualizations if they prefer it over the bar spectrum.

### Automated Metadata Orchestration

- Reads existing embedded ID3 tags for title, artist, album, and artwork.
- If metadata is missing or obfuscated (e.g., `"garbage_name"` aesthetics), triggers a fallback retrieval workflow.
- Provides explicit user choice for fallback retrieval:
  - **Shazam Recognition:** Utilizes audio fingerprinting to fetch accurate metadata.
  - **AI CreditsFetch (Gemini):** Leverages an LLM for fetching context, deep credits, or related metadata via advanced prompting.

---

## 3. The Recommended Tech Stack

To build a responsive, visually stunning player with automated background workflows, this is the recommended stack:

### Frontend & Application Shell

| Technology | Purpose |
|---|---|
| **Electron or Tauri** | Provides the container to run web technologies as a native desktop application, allowing file system access and system-level audio hooks. |
| **React or Vue.js** | The framework for building the polished, complex user interface and managing application state (playback controls, queues, user preferences). |
| **WebAudio API (AnalyserNode)** | The core engine used inside the frontend to tap into the audio stream and extract real-time frequency data arrays without directly fetching files. |
| **Canvas API / WebGL** | Handles the rendering. Canvas is sufficient for drawing smooth logarithmic bars; WebGL is required for the Butterchurn integration. |
| **Butterchurn (NPM Package)** | A WebGL-based implementation of the MilkDrop V2 engine for the alternative visualizer. |

### Background Orchestration & Metadata

| Technology | Purpose |
|---|---|
| **n8n (Workflow Automation)** | Acts as the central hub for handling metadata requests. It offloads the API logic from the frontend application. |
| **Shazam API (via RapidAPI)** | Used within n8n workflows when the user selects the "Shazam" fallback option. |
| **Gemini 1.5 Pro API** | Used within n8n workflows when the user selects the "CreditsFetch powered by AI" fallback option. |
| **AcoustID / MusicBrainz (Optional API)** | Can be used alongside n8n for initial, silent audio fingerprinting before prompting the user with the fallback options. |

---

## 4. Logical Workflow: Metadata Fallback

This outlines the specific logic for handling "garbage" filenames or missing tags:

1.  **File Load:** User plays `garbage_filename_01.mp3`.
2.  **Tag Inspection:** The frontend (React/Vue) reads the file and detects empty or invalid ID3 tags.
3.  **User Prompt:** The UI displays a notification:
    > *"We are unable to fetch song metadata due to the songfile name being garbage, so I strongly suggest you use Shazam or any fitting AI for fetching metadata or credits if you need it badly."*
4.  **Action Selection:** The user is presented with two action buttons:
    - `[ Shazam ]`
    - `[ CreditsFetch powered by AI ]`
5.  **Execution (via n8n Webhook):**
    - **If Shazam:** The app sends an audio snippet/fingerprint to an n8n webhook configured to ping the Shazam API.
    - **If AI:** The app sends the available context to an n8n webhook configured to query the Gemini API.
6.  **Resolution:** n8n returns the fetched metadata JSON to the frontend, updating the UI with the track name, artist, and potentially album art.

// ──── Metadata Parsing ────────────────────────────────────

export interface ParsedMetadata {
    title: string
    artist: string
    album: string
    duration: number
    artwork?: string // base64 data URL or remote URL
}

export async function parseMetadata(filePath: string, fileName: string): Promise<ParsedMetadata> {
    try {
        // Parse in the Electron main process via IPC (avoids Buffer polyfill issues)
        const result = await window.electronAPI.parseMetadata(filePath)

        return {
            title: result.title || stripExtension(fileName),
            artist: result.artist || 'Unknown Artist',
            album: result.album || 'Unknown Album',
            duration: result.duration || 0,
            artwork: result.artwork,
        }
    } catch {
        return {
            title: stripExtension(fileName),
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            duration: 0,
        }
    }
}

// ──── Metadata Validation ─────────────────────────────────

export function isMetadataValid(meta: ParsedMetadata, fileName: string): boolean {
    const title = meta.title.toLowerCase().trim()
    const baseName = stripExtension(fileName).toLowerCase().trim()

    // If title is just the filename, it's garbage
    if (title === baseName) return false

    // If title is empty or too short
    if (title.length < 2) return false

    // If title looks like garbage (random chars, underscores, hashes)
    const garbagePattern = /^[a-z0-9_\-\s]{2,}$/i
    const hasReadableWords = /[a-zA-Z]{3,}/.test(meta.title)
    if (garbagePattern.test(title) && !hasReadableWords) return false

    // If artist is still unknown, metadata is likely incomplete
    if (meta.artist === 'Unknown Artist') return false

    return true
}

// ──── Network Check ───────────────────────────────────────

export async function checkNetwork(): Promise<boolean> {
    if (!navigator.onLine) return false
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        await fetch('https://www.google.com/favicon.ico', {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal,
        })
        clearTimeout(timeout)
        return true
    } catch {
        return false
    }
}

// ──── Shazam Recognition (via node-shazam in main process) ─

export async function recognizeSong(filePath: string): Promise<ParsedMetadata | null> {
    const result = await window.electronAPI.recognizeSong(filePath)

    if (result.error) {
        throw new Error(`Recognition failed: ${result.error}`)
    }

    if (result.found && result.title) {
        return {
            title: result.title,
            artist: result.artist || 'Unknown Artist',
            album: result.album || 'Unknown Album',
            duration: 0,
            artwork: result.artwork,
        }
    }

    return null
}

// ──── Helpers ─────────────────────────────────────────────

function stripExtension(fileName: string): string {
    return fileName.replace(/\.[^/.]+$/, '')
}

// Type declarations for the Electron preload bridge

export interface ElectronAPI {
    openFiles: () => Promise<string[]>
    openFolder: () => Promise<string[]>
    readFile: (filePath: string) => Promise<Uint8Array>
    parseMetadata: (filePath: string) => Promise<{
        title: string
        artist: string
        album: string
        duration: number
        artwork?: string
        error?: string
    }>
    recognizeSong: (filePath: string) => Promise<{
        found: boolean
        title?: string
        artist?: string
        album?: string
        artwork?: string
        genre?: string
        error?: string
    }>
    minimize: () => void
    maximize: () => void
    close: () => void
    isMaximized: () => Promise<boolean>
    on: (channel: string, callback: (...args: any[]) => void) => void
    off: (channel: string, callback: (...args: any[]) => void) => void
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}

export { }

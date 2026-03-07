import { ipcRenderer, contextBridge } from 'electron'

// ──── Typed API Bridge ────────────────────────────────────

contextBridge.exposeInMainWorld('electronAPI', {
  // File dialogs
  openFiles: (): Promise<string[]> => ipcRenderer.invoke('dialog:openFiles'),
  openFolder: (): Promise<string[]> => ipcRenderer.invoke('dialog:openFolder'),

  // File system
  readFile: (filePath: string): Promise<Uint8Array> => ipcRenderer.invoke('fs:readFile', filePath),

  // Metadata parsing (done in main process)
  parseMetadata: (filePath: string): Promise<any> => ipcRenderer.invoke('metadata:parse', filePath),

  // Song recognition via Shazam (node-shazam in main process)
  recognizeSong: (filePath: string): Promise<any> => ipcRenderer.invoke('shazam:recognize', filePath),

  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),

  // Generic IPC
  on(channel: string, callback: (...args: any[]) => void) {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
  off(channel: string, callback: (...args: any[]) => void) {
    ipcRenderer.off(channel, callback)
  },
})

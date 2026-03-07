import { create } from 'zustand'

// ──── Types ───────────────────────────────────────────────

export interface Track {
    id: string
    filePath: string
    fileName: string
    title: string
    artist: string
    album: string
    duration: number
    artwork?: string // base64 data URL
    hasValidMetadata: boolean
}

export type RepeatMode = 'off' | 'all' | 'one'
export type VisualizerMode = 'spectrum' | 'milkdrop'

interface PlayerState {
    // Queue
    queue: Track[]
    currentIndex: number
    currentTrack: Track | null

    // Playback
    isPlaying: boolean
    volume: number
    isMuted: boolean
    currentTime: number
    duration: number
    shuffle: boolean
    repeat: RepeatMode

    // Visualizer
    visualizerMode: VisualizerMode

    // UI state
    isQueueOpen: boolean
    metadataDialogTrack: Track | null

    // Actions
    setQueue: (tracks: Track[]) => void
    addToQueue: (tracks: Track[]) => void
    playTrack: (index: number) => void
    playNext: () => void
    playPrevious: () => void
    togglePlayPause: () => void
    setIsPlaying: (playing: boolean) => void
    setVolume: (volume: number) => void
    toggleMute: () => void
    setCurrentTime: (time: number) => void
    setDuration: (duration: number) => void
    toggleShuffle: () => void
    cycleRepeat: () => void
    setVisualizerMode: (mode: VisualizerMode) => void
    toggleQueue: () => void
    removeFromQueue: (index: number) => void
    setMetadataDialogTrack: (track: Track | null) => void
    updateTrackMetadata: (id: string, metadata: Partial<Track>) => void
}

// ──── Store ───────────────────────────────────────────────

export const usePlayerStore = create<PlayerState>((set) => ({
    // Initial state
    queue: [],
    currentIndex: -1,
    currentTrack: null,
    isPlaying: false,
    volume: 0.75,
    isMuted: false,
    currentTime: 0,
    duration: 0,
    shuffle: false,
    repeat: 'off',
    visualizerMode: 'spectrum',
    isQueueOpen: false,
    metadataDialogTrack: null,

    // ── Queue management ──
    setQueue: (tracks) => set({
        queue: tracks,
        currentIndex: tracks.length > 0 ? 0 : -1,
        currentTrack: tracks[0] || null,
    }),

    addToQueue: (tracks) => set((state) => {
        const newQueue = [...state.queue, ...tracks]
        if (state.currentTrack === null && newQueue.length > 0) {
            return { queue: newQueue, currentIndex: 0, currentTrack: newQueue[0] }
        }
        return { queue: newQueue }
    }),

    playTrack: (index) => set((state) => {
        if (index >= 0 && index < state.queue.length) {
            return {
                currentIndex: index,
                currentTrack: state.queue[index],
                isPlaying: true,
                currentTime: 0,
            }
        }
        return state
    }),

    playNext: () => set((state) => {
        const { queue, currentIndex, shuffle, repeat } = state
        if (queue.length === 0) return state

        if (repeat === 'one') {
            return { currentTime: 0, isPlaying: true }
        }

        let nextIndex: number
        if (shuffle) {
            nextIndex = Math.floor(Math.random() * queue.length)
        } else {
            nextIndex = currentIndex + 1
        }

        if (nextIndex >= queue.length) {
            if (repeat === 'all') {
                nextIndex = 0
            } else {
                return { isPlaying: false }
            }
        }

        return {
            currentIndex: nextIndex,
            currentTrack: queue[nextIndex],
            isPlaying: true,
            currentTime: 0,
        }
    }),

    playPrevious: () => set((state) => {
        const { queue, currentIndex, currentTime } = state
        if (queue.length === 0) return state

        // If more than 3 seconds in, restart current track
        if (currentTime > 3) {
            return { currentTime: 0 }
        }

        const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1
        return {
            currentIndex: prevIndex,
            currentTrack: queue[prevIndex],
            isPlaying: true,
            currentTime: 0,
        }
    }),

    // ── Playback ──
    togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    setVolume: (volume) => set({ volume, isMuted: false }),
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    setCurrentTime: (time) => set({ currentTime: time }),
    setDuration: (duration) => set({ duration }),
    toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
    cycleRepeat: () => set((state) => {
        const modes: RepeatMode[] = ['off', 'all', 'one']
        const currentIdx = modes.indexOf(state.repeat)
        return { repeat: modes[(currentIdx + 1) % modes.length] }
    }),

    // ── Visualizer ──
    setVisualizerMode: (mode) => set({ visualizerMode: mode }),

    // ── UI ──
    toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),

    removeFromQueue: (index) => set((state) => {
        const newQueue = state.queue.filter((_, i) => i !== index)
        let newIndex = state.currentIndex
        if (index < state.currentIndex) {
            newIndex--
        } else if (index === state.currentIndex) {
            newIndex = Math.min(newIndex, newQueue.length - 1)
        }
        return {
            queue: newQueue,
            currentIndex: newIndex,
            currentTrack: newQueue[newIndex] || null,
        }
    }),

    setMetadataDialogTrack: (track) => set({ metadataDialogTrack: track }),

    updateTrackMetadata: (id, metadata) => set((state) => {
        const queue = state.queue.map(t => t.id === id ? { ...t, ...metadata } : t)
        const currentTrack = state.currentTrack?.id === id
            ? { ...state.currentTrack, ...metadata }
            : state.currentTrack
        return { queue, currentTrack }
    }),
}))

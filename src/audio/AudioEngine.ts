// ──── AudioEngine ─────────────────────────────────────────
// Wraps WebAudio API for playback & analysis data extraction.

export class AudioEngine {
    private audioContext: AudioContext
    private analyser: AnalyserNode
    private gainNode: GainNode
    private sourceNode: MediaElementAudioSourceNode | null = null
    private audioElement: HTMLAudioElement
    private _isConnected = false

    constructor() {
        this.audioContext = new AudioContext()
        this.analyser = this.audioContext.createAnalyser()
        this.analyser.fftSize = 4096  // higher = better sub-bass resolution
        this.analyser.smoothingTimeConstant = 0.45  // reactive but not twitchy
        this.analyser.minDecibels = -100  // catch quieter sub-bass
        this.analyser.maxDecibels = -10

        this.gainNode = this.audioContext.createGain()
        this.gainNode.connect(this.analyser)
        this.analyser.connect(this.audioContext.destination)

        this.audioElement = new Audio()
        this.audioElement.crossOrigin = 'anonymous'
    }

    // ── Public Getters ──

    get element(): HTMLAudioElement {
        return this.audioElement
    }

    get context(): AudioContext {
        return this.audioContext
    }

    get analyserNode(): AnalyserNode {
        return this.analyser
    }

    get frequencyBinCount(): number {
        return this.analyser.frequencyBinCount
    }

    // ── Playback Controls ──

    async loadTrack(fileUrl: string): Promise<void> {
        // Resume context if suspended (browsers require user gesture)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume()
        }

        this.audioElement.src = fileUrl

        // Only create source node once
        if (!this._isConnected) {
            this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement)
            this.sourceNode.connect(this.gainNode)
            this._isConnected = true
        }

        await this.audioElement.load()
    }

    async play(): Promise<void> {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume()
        }
        await this.audioElement.play()
    }

    pause(): void {
        this.audioElement.pause()
    }

    seek(time: number): void {
        this.audioElement.currentTime = time
    }

    setVolume(volume: number): void {
        this.gainNode.gain.value = Math.max(0, Math.min(1, volume))
    }

    mute(): void {
        this.audioElement.muted = true
    }

    unmute(): void {
        this.audioElement.muted = false
    }

    // ── Analysis Data ──

    getFrequencyData(): Uint8Array {
        const data = new Uint8Array(this.analyser.frequencyBinCount)
        this.analyser.getByteFrequencyData(data)
        return data
    }

    getTimeDomainData(): Uint8Array {
        const data = new Uint8Array(this.analyser.frequencyBinCount)
        this.analyser.getByteTimeDomainData(data)
        return data
    }

    // ── Lifecycle ──

    destroy(): void {
        this.audioElement.pause()
        this.audioElement.src = ''
        if (this.sourceNode) {
            this.sourceNode.disconnect()
        }
        this.gainNode.disconnect()
        this.analyser.disconnect()
        this.audioContext.close()
    }
}

// Singleton instance
let engineInstance: AudioEngine | null = null

export function getAudioEngine(): AudioEngine {
    if (!engineInstance) {
        engineInstance = new AudioEngine()
    }
    return engineInstance
}

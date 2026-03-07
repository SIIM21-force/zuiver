import React, { useRef, useEffect, useCallback } from 'react'
import { getAudioEngine } from '../../audio/AudioEngine'
import { usePlayerStore } from '../../store/playerStore'
import './LogBarSpectrum.css'

// ──── Monstercat-style logarithmic bar spectrum ───────────
// 63 bars, logarithmic frequency mapping with sub-bass gain compensation

const BAR_COUNT = 63
const MIN_FREQ = 20
const MAX_FREQ = 16000

function buildLogBands(binCount: number, sampleRate: number): { start: number; end: number; centerFreq: number }[] {
    const bands: { start: number; end: number; centerFreq: number }[] = []
    const logMin = Math.log10(MIN_FREQ)
    const logMax = Math.log10(MAX_FREQ)
    const binWidth = sampleRate / (binCount * 2)

    for (let i = 0; i < BAR_COUNT; i++) {
        const freqLow = Math.pow(10, logMin + (logMax - logMin) * (i / BAR_COUNT))
        const freqHigh = Math.pow(10, logMin + (logMax - logMin) * ((i + 1) / BAR_COUNT))
        const centerFreq = (freqLow + freqHigh) / 2
        const startBin = Math.max(0, Math.floor(freqLow / binWidth))
        const endBin = Math.min(binCount - 1, Math.floor(freqHigh / binWidth))
        bands.push({ start: startBin, end: Math.max(startBin, endBin), centerFreq })
    }

    return bands
}

// ──── Frequency-dependent gain compensation ───────────────
// Low frequencies have less energy in FFT — boost sub-bass and bass
// to match how we perceive loudness (roughly inverse equal-loudness)

function getFrequencyGain(centerFreq: number): number {
    if (centerFreq < 40) return 1.15       // deep sub-bass: gentle lift only
    if (centerFreq < 80) return 1.25       // sub-bass
    if (centerFreq < 150) return 1.3       // bass (the natural peak)
    if (centerFreq < 300) return 1.15      // upper bass
    if (centerFreq < 600) return 1.05      // low-mids
    if (centerFreq < 2000) return 1.0      // mids (reference level)
    if (centerFreq < 6000) return 0.95     // upper-mids
    return 0.85                             // highs
}

// ──── Color palette ───────────────────────────────────────

function getBarColor(index: number, total: number, intensity: number): string {
    const hue = 250 + (index / total) * 80 // violet → pink range
    const sat = 70 + intensity * 30
    const light = 45 + intensity * 25
    return `hsl(${hue}, ${sat}%, ${light}%)`
}

// ──── Component ───────────────────────────────────────────

export const LogBarSpectrum: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)
    const bandsRef = useRef<{ start: number; end: number; centerFreq: number }[]>([])
    const smoothedRef = useRef<Float32Array>(new Float32Array(BAR_COUNT))
    const isPlaying = usePlayerStore((s) => s.isPlaying)

    const draw = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const engine = getAudioEngine()

        // Resize canvas to match display size
        const rect = canvas.getBoundingClientRect()
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width
            canvas.height = rect.height
        }

        const { width, height } = canvas

        // Build bands lazily
        if (bandsRef.current.length === 0) {
            const sampleRate = engine.context.sampleRate
            bandsRef.current = buildLogBands(engine.frequencyBinCount, sampleRate)
        }

        // Get frequency data
        const freqData = engine.getFrequencyData()
        const bands = bandsRef.current
        const smoothed = smoothedRef.current

        // Clear
        ctx.clearRect(0, 0, width, height)

        // Draw bars
        const gap = 2
        const barWidth = (width - gap * (BAR_COUNT - 1)) / BAR_COUNT

        for (let i = 0; i < BAR_COUNT; i++) {
            const band = bands[i]

            // Take MAX of bins in band (not average) for punchier response
            let maxVal = 0
            for (let b = band.start; b <= band.end; b++) {
                if (freqData[b] > maxVal) maxVal = freqData[b]
            }
            const normalized = maxVal / 255

            // Apply frequency-dependent gain compensation
            const gain = getFrequencyGain(band.centerFreq)
            const boosted = Math.min(1, normalized * gain)

            // Smoothing: fast attack, gravity-style decay
            //  - Sub-bass/bass bars (first ~12) get more smoothing for Monstercat-style calm low end
            //  - Mid/high bars snap quickly
            const prev = smoothed[i]
            const isLowEnd = i < 12
            const attackSpeed = isLowEnd ? 0.45 : 0.8   // low end calmer attack
            const decaySpeed = isLowEnd ? 0.08 : 0.15   // low end slower decay

            smoothed[i] = boosted > prev
                ? prev + (boosted - prev) * attackSpeed
                : prev + (boosted - prev) * decaySpeed

            const barHeight = smoothed[i] * height * 0.88
            const x = i * (barWidth + gap)
            const y = height - barHeight

            // Gradient bar
            const color = getBarColor(i, BAR_COUNT, smoothed[i])
            const gradient = ctx.createLinearGradient(x, height, x, y)
            gradient.addColorStop(0, color)
            gradient.addColorStop(1, `${color.slice(0, -1)}, 0.3)`.replace('hsl', 'hsla'))

            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0])
            ctx.fill()

            // Glow effect for high-intensity bars
            if (smoothed[i] > 0.55) {
                ctx.shadowColor = color
                ctx.shadowBlur = 14
                ctx.fillStyle = `${color.slice(0, -1)}, 0.25)`.replace('hsl', 'hsla')
                ctx.beginPath()
                ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0])
                ctx.fill()
                ctx.shadowBlur = 0
            }
        }

        // Floor line (Monstercat-style base line)
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, height - 1)
        ctx.lineTo(width, height - 1)
        ctx.stroke()

        animRef.current = requestAnimationFrame(draw)
    }, [])

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw)
        return () => cancelAnimationFrame(animRef.current)
    }, [draw])

    return (
        <canvas
            ref={canvasRef}
            className={`log-bar-spectrum ${isPlaying ? 'active' : ''}`}
        />
    )
}

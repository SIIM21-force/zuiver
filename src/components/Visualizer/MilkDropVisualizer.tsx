import React, { useRef, useEffect, useState } from 'react'
import { getAudioEngine } from '../../audio/AudioEngine'
import './MilkDropVisualizer.css'

// Lazy-load butterchurn to avoid bloating initial bundle
let butterchurnModule: any = null
let presetsModule: any = null

async function loadButterchurn() {
    if (!butterchurnModule) {
        butterchurnModule = await import('butterchurn')
        presetsModule = await import('butterchurn-presets')
    }
    const PresetsClass = presetsModule.default || presetsModule
    return {
        butterchurn: butterchurnModule.default || butterchurnModule,
        presets: PresetsClass.getPresets ? PresetsClass.getPresets() : PresetsClass,
    }
}

export const MilkDropVisualizer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const visualizerRef = useRef<any>(null)
    const animRef = useRef<number>(0)
    const [presetNames, setPresetNames] = useState<string[]>([])
    const [currentPreset, setCurrentPreset] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        let lastW = 0
        let lastH = 0

        const init = async () => {
            try {
                const canvas = canvasRef.current
                if (!canvas) return

                const { butterchurn, presets } = await loadButterchurn()
                if (cancelled) return

                // Use the milkdrop-container div as the size reference
                const container = canvas.parentElement!
                const rect = container.getBoundingClientRect()
                canvas.width = rect.width
                canvas.height = rect.height
                lastW = rect.width
                lastH = rect.height

                const engine = getAudioEngine()
                const audioContext = engine.context

                const visualizer = butterchurn.createVisualizer(audioContext, canvas, {
                    width: rect.width,
                    height: rect.height,
                    pixelRatio: 1,
                })

                visualizer.connectAudio(engine.analyserNode)

                const names = Object.keys(presets)
                setPresetNames(names)

                const initialPreset = names[Math.floor(Math.random() * names.length)]
                visualizer.loadPreset(presets[initialPreset], 0)
                setCurrentPreset(initialPreset)

                visualizerRef.current = { visualizer, presets }
                setIsLoading(false)

                // Render loop with per-frame size check
                const render = () => {
                    if (cancelled) return

                    // Check if container size changed every frame
                    const r = container.getBoundingClientRect()
                    if (r.width > 0 && r.height > 0 && (Math.abs(r.width - lastW) > 1 || Math.abs(r.height - lastH) > 1)) {
                        lastW = r.width
                        lastH = r.height
                        canvas.width = r.width
                        canvas.height = r.height
                        visualizer.setRendererSize(r.width, r.height)
                    }

                    visualizer.render()
                    animRef.current = requestAnimationFrame(render)
                }
                animRef.current = requestAnimationFrame(render)
            } catch (err: any) {
                if (!cancelled) {
                    setError(err.message || 'Failed to initialize MilkDrop')
                    setIsLoading(false)
                }
            }
        }

        init()

        return () => {
            cancelled = true
            cancelAnimationFrame(animRef.current)
        }
    }, [])

    const changePreset = (name: string) => {
        if (visualizerRef.current) {
            visualizerRef.current.visualizer.loadPreset(
                visualizerRef.current.presets[name],
                2.0 // 2 second blend
            )
            setCurrentPreset(name)
        }
    }

    const randomPreset = () => {
        const name = presetNames[Math.floor(Math.random() * presetNames.length)]
        changePreset(name)
    }

    return (
        <div className="milkdrop-container">
            <canvas ref={canvasRef} className="milkdrop-canvas" />

            {isLoading && (
                <div className="milkdrop-loading">
                    <div className="milkdrop-spinner" />
                    <span>Loading MilkDrop...</span>
                </div>
            )}

            {error && (
                <div className="milkdrop-error">
                    <span>⚠ {error}</span>
                </div>
            )}

            {!isLoading && !error && (
                <div className="milkdrop-controls">
                    <select
                        className="milkdrop-select"
                        value={currentPreset}
                        onChange={(e) => changePreset(e.target.value)}
                    >
                        {presetNames.map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                    <button className="milkdrop-random-btn" onClick={randomPreset} title="Random preset">
                        🎲
                    </button>
                </div>
            )}
        </div>
    )
}

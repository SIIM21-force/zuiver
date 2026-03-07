import React from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { LogBarSpectrum } from './LogBarSpectrum'
import { MilkDropVisualizer } from './MilkDropVisualizer'
import './VisualizerContainer.css'

export const VisualizerContainer: React.FC = () => {
    const visualizerMode = usePlayerStore((s) => s.visualizerMode)
    const setVisualizerMode = usePlayerStore((s) => s.setVisualizerMode)

    return (
        <div className="visualizer-container">
            <div className="visualizer-canvas-area">
                {visualizerMode === 'spectrum' ? (
                    <LogBarSpectrum />
                ) : (
                    <MilkDropVisualizer />
                )}
            </div>

            <div className="visualizer-mode-toggle">
                <button
                    className={`viz-toggle-btn ${visualizerMode === 'spectrum' ? 'active' : ''}`}
                    onClick={() => setVisualizerMode('spectrum')}
                >
                    Spectrum
                </button>
                <button
                    className={`viz-toggle-btn ${visualizerMode === 'milkdrop' ? 'active' : ''}`}
                    onClick={() => setVisualizerMode('milkdrop')}
                >
                    MilkDrop
                </button>
            </div>
        </div>
    )
}

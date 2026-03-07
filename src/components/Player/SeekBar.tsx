import React from 'react'
import './SeekBar.css'

interface SeekBarProps {
    currentTime: number
    duration: number
    onSeek: (time: number) => void
}

function formatTime(seconds: number): string {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const SeekBar: React.FC<SeekBarProps> = ({ currentTime, duration, onSeek }) => {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const pct = x / rect.width
        onSeek(pct * duration)
    }

    const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.buttons !== 1) return
        handleClick(e)
    }

    return (
        <div className="seek-bar-container">
            <span className="seek-time">{formatTime(currentTime)}</span>
            <div
                className="seek-track"
                onClick={handleClick}
                onMouseMove={handleDrag}
            >
                <div className="seek-filled" style={{ width: `${progress}%` }}>
                    <div className="seek-thumb" />
                </div>
            </div>
            <span className="seek-time">{formatTime(duration)}</span>
        </div>
    )
}

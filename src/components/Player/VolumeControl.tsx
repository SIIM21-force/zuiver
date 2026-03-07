import React from 'react'
import { IoVolumeHigh, IoVolumeLow, IoVolumeMute, IoVolumeOff } from 'react-icons/io5'
import './VolumeControl.css'

interface VolumeControlProps {
    volume: number
    isMuted: boolean
    onVolumeChange: (volume: number) => void
    onToggleMute: () => void
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
    volume,
    isMuted,
    onVolumeChange,
    onToggleMute,
}) => {
    const effectiveVolume = isMuted ? 0 : volume

    const getVolumeIcon = () => {
        if (isMuted || volume === 0) return <IoVolumeOff />
        if (volume < 0.3) return <IoVolumeMute />
        if (volume < 0.7) return <IoVolumeLow />
        return <IoVolumeHigh />
    }

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const pct = Math.max(0, Math.min(1, x / rect.width))
        onVolumeChange(pct)
    }

    const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.buttons !== 1) return
        handleClick(e)
    }

    return (
        <div className="volume-control">
            <button className="volume-btn" onClick={onToggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                {getVolumeIcon()}
            </button>
            <div
                className="volume-track"
                onClick={handleClick}
                onMouseMove={handleDrag}
            >
                <div className="volume-filled" style={{ width: `${effectiveVolume * 100}%` }} />
            </div>
        </div>
    )
}

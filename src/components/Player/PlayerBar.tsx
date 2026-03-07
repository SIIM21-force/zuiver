import React, { useEffect, useRef, useCallback, useState } from 'react'
import {
    IoPlaySharp,
    IoPauseSharp,
    IoPlaySkipForwardSharp,
    IoPlaySkipBackSharp,
    IoShuffleSharp,
    IoRepeatSharp,
    IoListSharp,
    IoInformationCircleOutline,
} from 'react-icons/io5'
import { TbRepeatOnce } from 'react-icons/tb'
import { usePlayerStore } from '../../store/playerStore'
import { getAudioEngine } from '../../audio/AudioEngine'
import { SeekBar } from './SeekBar'
import { VolumeControl } from './VolumeControl'
import './PlayerBar.css'

export const PlayerBar: React.FC = () => {
    const {
        currentTrack,
        isPlaying,
        volume,
        isMuted,
        currentTime,
        duration,
        shuffle,
        repeat,
        isQueueOpen,
        togglePlayPause,
        playNext,
        playPrevious,
        setVolume,
        toggleMute,
        setCurrentTime,
        setDuration,
        setIsPlaying,
        toggleShuffle,
        cycleRepeat,
        toggleQueue,
        setMetadataDialogTrack,
    } = usePlayerStore()

    const animFrameRef = useRef<number>(0)
    const engineRef = useRef(getAudioEngine())
    const [showArtwork, setShowArtwork] = useState(false)
    const [closingArtwork, setClosingArtwork] = useState(false)

    // ── Sync audio engine with store state ──

    useEffect(() => {
        const engine = engineRef.current
        if (!currentTrack) return

        const fileUrl = `file:///${currentTrack.filePath.replace(/\\/g, '/')}`
        engine.loadTrack(fileUrl).then(() => {
            if (isPlaying) engine.play()
        })
    }, [currentTrack?.id])

    useEffect(() => {
        const engine = engineRef.current
        if (isPlaying) {
            engine.play().catch(() => { })
        } else {
            engine.pause()
        }
    }, [isPlaying])

    useEffect(() => {
        const engine = engineRef.current
        engine.setVolume(isMuted ? 0 : volume)
    }, [volume, isMuted])

    // ── Time update loop ──

    const updateTime = useCallback(() => {
        const el = engineRef.current.element
        if (!el.paused) {
            setCurrentTime(el.currentTime)
        }
        animFrameRef.current = requestAnimationFrame(updateTime)
    }, [setCurrentTime])

    useEffect(() => {
        animFrameRef.current = requestAnimationFrame(updateTime)
        return () => cancelAnimationFrame(animFrameRef.current)
    }, [updateTime])

    // ── Audio element event listeners ──

    useEffect(() => {
        const el = engineRef.current.element

        const onLoaded = () => setDuration(el.duration)
        const onEnded = () => playNext()
        const onError = () => setIsPlaying(false)

        el.addEventListener('loadedmetadata', onLoaded)
        el.addEventListener('ended', onEnded)
        el.addEventListener('error', onError)

        return () => {
            el.removeEventListener('loadedmetadata', onLoaded)
            el.removeEventListener('ended', onEnded)
            el.removeEventListener('error', onError)
        }
    }, [setDuration, playNext, setIsPlaying])

    const handleSeek = useCallback((time: number) => {
        engineRef.current.seek(time)
        setCurrentTime(time)
    }, [setCurrentTime])

    // ── Repeat icon ──
    const RepeatIcon = repeat === 'one' ? TbRepeatOnce : IoRepeatSharp

    return (
        <>
            <div className="player-bar">
                {/* Track info — clickable to show artwork */}
                <div className="player-track-info">
                    <div
                        className={`player-track-clickable ${currentTrack ? 'has-track' : ''}`}
                        onClick={() => currentTrack && setShowArtwork(true)}
                        title={currentTrack ? 'View artwork' : undefined}
                    >
                        {currentTrack?.artwork ? (
                            <img className="player-artwork" src={currentTrack.artwork} alt="Album art" />
                        ) : (
                            <div className="player-artwork player-artwork-placeholder">
                                <span>♪</span>
                            </div>
                        )}
                        <div className="player-track-text">
                            <div className="player-track-title">{currentTrack?.title || 'No track selected'}</div>
                            <div className="player-track-artist">{currentTrack?.artist || '—'}</div>
                        </div>
                    </div>
                    {currentTrack && (
                        <button
                            className="player-ctrl-btn small player-info-btn"
                            onClick={() => setMetadataDialogTrack(currentTrack)}
                            title="View metadata / Recognize song"
                        >
                            <IoInformationCircleOutline />
                        </button>
                    )}
                </div>

                {/* Center controls */}
                <div className="player-center">
                    <div className="player-controls">
                        <button
                            className={`player-ctrl-btn small ${shuffle ? 'active' : ''}`}
                            onClick={toggleShuffle}
                            title="Shuffle"
                        >
                            <IoShuffleSharp />
                        </button>
                        <button className="player-ctrl-btn" onClick={playPrevious} title="Previous">
                            <IoPlaySkipBackSharp />
                        </button>
                        <button className="player-ctrl-btn play-btn" onClick={togglePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
                            {isPlaying ? <IoPauseSharp /> : <IoPlaySharp />}
                        </button>
                        <button className="player-ctrl-btn" onClick={playNext} title="Next">
                            <IoPlaySkipForwardSharp />
                        </button>
                        <button
                            className={`player-ctrl-btn small ${repeat !== 'off' ? 'active' : ''}`}
                            onClick={cycleRepeat}
                            title={`Repeat: ${repeat}`}
                        >
                            <RepeatIcon />
                        </button>
                    </div>
                    <SeekBar currentTime={currentTime} duration={duration} onSeek={handleSeek} />
                </div>

                {/* Right controls */}
                <div className="player-right">
                    <VolumeControl
                        volume={volume}
                        isMuted={isMuted}
                        onVolumeChange={setVolume}
                        onToggleMute={toggleMute}
                    />
                    <button
                        className={`player-ctrl-btn small ${isQueueOpen ? 'active' : ''}`}
                        onClick={toggleQueue}
                        title="Queue"
                    >
                        <IoListSharp />
                    </button>
                </div>
            </div>

            {/* Artwork fly-in modal */}
            {showArtwork && currentTrack && (
                <div
                    className={`artwork-modal-overlay ${closingArtwork ? 'closing' : ''}`}
                    onClick={() => {
                        setClosingArtwork(true)
                        setTimeout(() => {
                            setShowArtwork(false)
                            setClosingArtwork(false)
                        }, 250)
                    }}
                >
                    <div className={`artwork-modal ${closingArtwork ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        {currentTrack.artwork ? (
                            <img
                                className="artwork-modal-img"
                                src={currentTrack.artwork}
                                alt={currentTrack.title}
                            />
                        ) : (
                            <div className="artwork-modal-placeholder">♪</div>
                        )}
                        <div className="artwork-modal-info">
                            <div className="artwork-modal-title">{currentTrack.title}</div>
                            <div className="artwork-modal-artist">{currentTrack.artist}</div>
                            {currentTrack.album && currentTrack.album !== 'Unknown Album' && (
                                <div className="artwork-modal-album">{currentTrack.album}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

import React, { useState, useEffect } from 'react'
import { IoClose, IoMusicalNotes, IoWifi } from 'react-icons/io5'
import { SiShazam } from 'react-icons/si'
import { usePlayerStore } from '../../store/playerStore'
import { checkNetwork, recognizeSong } from '../../services/metadataService'
import './MetadataDialog.css'

export const MetadataDialog: React.FC = () => {
    const track = usePlayerStore((s) => s.metadataDialogTrack)
    const setMetadataDialogTrack = usePlayerStore((s) => s.setMetadataDialogTrack)
    const updateTrackMetadata = usePlayerStore((s) => s.updateTrackMetadata)

    const [isOnline, setIsOnline] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        if (track) {
            checkNetwork().then(setIsOnline)
            setError(null)
            setSuccess(null)
        }
    }, [track])

    if (!track) return null

    const hasValid = track.hasValidMetadata

    const handleClose = () => {
        setMetadataDialogTrack(null)
        setError(null)
        setSuccess(null)
        setIsLoading(false)
    }

    const handleRecognize = async () => {
        if (!isOnline) return
        setIsLoading(true)
        setError(null)

        try {
            const result = await recognizeSong(track.filePath)

            if (result) {
                updateTrackMetadata(track.id, {
                    title: result.title,
                    artist: result.artist,
                    album: result.album,
                    artwork: result.artwork || track.artwork,
                    hasValidMetadata: true,
                })
                setSuccess(`Found: "${result.title}" by ${result.artist}`)
                setTimeout(handleClose, 2500)
            } else {
                setError('Could not identify this track. Try a different file or check audio quality.')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="metadata-overlay" onClick={handleClose}>
            <div className="metadata-dialog" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="metadata-header">
                    <div className="metadata-header-icon">
                        <IoMusicalNotes />
                    </div>
                    <h2>{hasValid ? 'Track Info' : 'Missing Metadata'}</h2>
                    <button className="metadata-close-btn" onClick={handleClose}>
                        <IoClose />
                    </button>
                </div>

                {/* Body */}
                <div className="metadata-body">
                    {/* Track preview — shows artwork + metadata if available */}
                    <div className="metadata-track-preview">
                        {track.artwork ? (
                            <img className="metadata-preview-artwork" src={track.artwork} alt="Album art" />
                        ) : (
                            <div className="metadata-preview-art">♪</div>
                        )}
                        <div>
                            <div className="metadata-preview-title">
                                {hasValid ? track.title : track.fileName}
                            </div>
                            <div className="metadata-preview-info">
                                {hasValid
                                    ? `${track.artist} · ${track.album}`
                                    : 'No valid metadata found'}
                            </div>
                        </div>
                    </div>

                    {/* Metadata details for valid tracks */}
                    {hasValid && (
                        <div className="metadata-details">
                            <div className="metadata-detail-row">
                                <span className="metadata-label">Title</span>
                                <span className="metadata-value">{track.title}</span>
                            </div>
                            <div className="metadata-detail-row">
                                <span className="metadata-label">Artist</span>
                                <span className="metadata-value">{track.artist}</span>
                            </div>
                            <div className="metadata-detail-row">
                                <span className="metadata-label">Album</span>
                                <span className="metadata-value">{track.album}</span>
                            </div>
                            <div className="metadata-detail-row">
                                <span className="metadata-label">File</span>
                                <span className="metadata-value metadata-value-file">{track.fileName}</span>
                            </div>
                        </div>
                    )}

                    {!hasValid && (
                        <p className="metadata-message">
                            We couldn't read valid metadata from this file. Use Shazam to
                            identify the song by its audio fingerprint.
                        </p>
                    )}

                    {/* Offline warning */}
                    {!isOnline && (
                        <div className="metadata-offline">
                            <div className="metadata-offline-icon"><IoWifi /></div>
                            <div className="metadata-offline-messages">
                                <div className="metadata-offline-simple">
                                    No internet connection. Shazam recognition requires internet.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="metadata-error"><span>⚠ {error}</span></div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="metadata-success"><span>✓ {success}</span></div>
                    )}

                    {/* Action button */}
                    <div className="metadata-actions">
                        <button
                            className="metadata-action-btn shazam-btn"
                            onClick={handleRecognize}
                            disabled={!isOnline || isLoading}
                        >
                            {isLoading ? (
                                <div className="metadata-btn-spinner" />
                            ) : (
                                <SiShazam />
                            )}
                            <span>
                                {isLoading
                                    ? 'Listening...'
                                    : hasValid
                                        ? 'Re-identify with Shazam'
                                        : 'Recognize with Shazam'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

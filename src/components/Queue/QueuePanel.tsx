import React from 'react'
import {
    IoClose,
    IoMusicalNote,
    IoPlaySharp,
    IoTrashBinOutline,
} from 'react-icons/io5'
import { usePlayerStore } from '../../store/playerStore'
import './QueuePanel.css'

export const QueuePanel: React.FC = () => {
    const queue = usePlayerStore((s) => s.queue)
    const currentIndex = usePlayerStore((s) => s.currentIndex)
    const isQueueOpen = usePlayerStore((s) => s.isQueueOpen)
    const toggleQueue = usePlayerStore((s) => s.toggleQueue)
    const playTrack = usePlayerStore((s) => s.playTrack)
    const removeFromQueue = usePlayerStore((s) => s.removeFromQueue)

    return (
        <div className={`queue-panel ${isQueueOpen ? 'open' : ''}`}>
            <div className="queue-header">
                <h3>Queue</h3>
                <span className="queue-count">{queue.length} tracks</span>
                <button className="queue-close-btn" onClick={toggleQueue}>
                    <IoClose />
                </button>
            </div>

            <div className="queue-list">
                {queue.length === 0 ? (
                    <div className="queue-empty">
                        <IoMusicalNote className="queue-empty-icon" />
                        <p>No tracks in queue</p>
                        <p className="queue-empty-hint">Open files or drop audio here</p>
                    </div>
                ) : (
                    queue.map((track, index) => (
                        <div
                            key={track.id}
                            className={`queue-item ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => playTrack(index)}
                        >
                            <div className="queue-item-index">
                                {index === currentIndex ? (
                                    <IoPlaySharp className="queue-playing-icon" />
                                ) : (
                                    <span>{index + 1}</span>
                                )}
                            </div>

                            {track.artwork ? (
                                <img className="queue-item-art" src={track.artwork} alt="" />
                            ) : (
                                <div className="queue-item-art queue-item-art-placeholder">♪</div>
                            )}

                            <div className="queue-item-info">
                                <div className="queue-item-title">{track.title}</div>
                                <div className="queue-item-artist">{track.artist}</div>
                            </div>

                            <button
                                className="queue-item-remove"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removeFromQueue(index)
                                }}
                                title="Remove"
                            >
                                <IoTrashBinOutline />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

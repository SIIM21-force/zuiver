import React, { useState, useCallback } from 'react'
import { IoCloudUploadOutline, IoFolderOpenOutline, IoDocumentOutline } from 'react-icons/io5'
import { usePlayerStore, Track } from '../../store/playerStore'
import { parseMetadata, isMetadataValid } from '../../services/metadataService'
import './FileDropZone.css'

let trackIdCounter = 0
function generateId(): string {
    return `track-${Date.now()}-${trackIdCounter++}`
}

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a']

function isAudioFile(path: string): boolean {
    const ext = path.substring(path.lastIndexOf('.')).toLowerCase()
    return AUDIO_EXTENSIONS.includes(ext)
}

function getFileName(filePath: string): string {
    return filePath.split(/[\\/]/).pop() || filePath
}

export const FileDropZone: React.FC = () => {
    const addToQueue = usePlayerStore((s) => s.addToQueue)
    const queue = usePlayerStore((s) => s.queue)
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const processFiles = useCallback(async (filePaths: string[]) => {
        if (filePaths.length === 0) return
        setIsProcessing(true)

        const tracks: Track[] = []

        for (const filePath of filePaths) {
            if (!isAudioFile(filePath)) continue

            const fileName = getFileName(filePath)
            const id = generateId()

            try {
                const meta = await parseMetadata(filePath, fileName)
                const valid = isMetadataValid(meta, fileName)

                const track: Track = {
                    id,
                    filePath,
                    fileName,
                    title: meta.title,
                    artist: meta.artist,
                    album: meta.album,
                    duration: meta.duration,
                    artwork: meta.artwork,
                    hasValidMetadata: valid,
                }

                tracks.push(track)
            } catch {
                // Fallback track with just filename
                tracks.push({
                    id,
                    filePath,
                    fileName,
                    title: fileName.replace(/\.[^/.]+$/, ''),
                    artist: 'Unknown Artist',
                    album: 'Unknown Album',
                    duration: 0,
                    hasValidMetadata: false,
                })
            }
        }

        if (tracks.length > 0) {
            addToQueue(tracks)
        }

        setIsProcessing(false)
    }, [addToQueue])

    const handleOpenFiles = async () => {
        const files = await window.electronAPI.openFiles()
        processFiles(files)
    }

    const handleOpenFolder = async () => {
        const files = await window.electronAPI.openFolder()
        processFiles(files)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files)
        const paths = files
            .filter(f => isAudioFile(f.name))
            .map(f => (f as any).path)
            .filter(Boolean)

        processFiles(paths)
    }

    // If tracks are already loaded, show a compact add button
    if (queue.length > 0) {
        return (
            <div className="file-drop-compact">
                <div
                    className={`file-drop-compact-zone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <button className="file-add-btn" onClick={handleOpenFiles} disabled={isProcessing}>
                        <IoDocumentOutline />
                        Add Files
                    </button>
                    <button className="file-add-btn" onClick={handleOpenFolder} disabled={isProcessing}>
                        <IoFolderOpenOutline />
                        Add Folder
                    </button>
                    {isProcessing && <div className="file-processing-spinner" />}
                </div>
            </div>
        )
    }

    // Initial empty state — full drop zone
    return (
        <div
            className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isProcessing ? (
                <div className="file-drop-loading">
                    <div className="file-processing-spinner large" />
                    <span>Processing files...</span>
                </div>
            ) : (
                <>
                    <div className="file-drop-icon">
                        <IoCloudUploadOutline />
                    </div>
                    <h3 className="file-drop-title">Drop audio files here</h3>
                    <p className="file-drop-subtitle">or browse to get started</p>
                    <div className="file-drop-buttons">
                        <button className="file-drop-btn primary" onClick={handleOpenFiles}>
                            <IoDocumentOutline />
                            Open Files
                        </button>
                        <button className="file-drop-btn" onClick={handleOpenFolder}>
                            <IoFolderOpenOutline />
                            Open Folder
                        </button>
                    </div>
                    <p className="file-drop-formats">MP3 · WAV · FLAC · OGG · AAC · M4A</p>
                </>
            )}
        </div>
    )
}

import React from 'react'
import { VscChromeMinimize, VscChromeMaximize, VscChromeClose, VscChromeRestore } from 'react-icons/vsc'
import './TitleBar.css'

export const TitleBar: React.FC = () => {
    const [isMaximized, setIsMaximized] = React.useState(false)

    React.useEffect(() => {
        window.electronAPI?.isMaximized().then(setIsMaximized)
    }, [])

    const handleMinimize = () => window.electronAPI?.minimize()
    const handleMaximize = () => {
        window.electronAPI?.maximize()
        setIsMaximized(!isMaximized)
    }
    const handleClose = () => window.electronAPI?.close()

    return (
        <div className="title-bar">
            <div className="title-bar-drag">
                <span className="title-bar-text">ZUIVER</span>
            </div>
            <div className="title-bar-controls">
                <button className="title-btn" onClick={handleMinimize} title="Minimize">
                    <VscChromeMinimize />
                </button>
                <button className="title-btn" onClick={handleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
                    {isMaximized ? <VscChromeRestore /> : <VscChromeMaximize />}
                </button>
                <button className="title-btn title-btn-close" onClick={handleClose} title="Close">
                    <VscChromeClose />
                </button>
            </div>
        </div>
    )
}

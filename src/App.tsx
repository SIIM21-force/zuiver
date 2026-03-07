import { TitleBar } from './components/TitleBar/TitleBar'
import { VisualizerContainer } from './components/Visualizer/VisualizerContainer'
import { PlayerBar } from './components/Player/PlayerBar'
import { QueuePanel } from './components/Queue/QueuePanel'
import { FileDropZone } from './components/Library/FileDropZone'
import { MetadataDialog } from './components/Metadata/MetadataDialog'
import { usePlayerStore } from './store/playerStore'
import './App.css'

function App() {
  const queue = usePlayerStore((s) => s.queue)
  const isQueueOpen = usePlayerStore((s) => s.isQueueOpen)

  return (
    <div className="app">
      <TitleBar />

      <main className={`app-main ${isQueueOpen ? 'queue-open' : ''}`}>
        {queue.length > 0 ? (
          <>
            <VisualizerContainer />
            <FileDropZone />
          </>
        ) : (
          <FileDropZone />
        )}
      </main>

      <QueuePanel />
      <PlayerBar />
      <MetadataDialog />
    </div>
  )
}

export default App

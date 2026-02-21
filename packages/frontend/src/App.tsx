import { useFlowStore } from './store/useFlowStore';

import { Screen00Title } from './components/screens/Screen00Title';
import { Screen01Prepare } from './components/screens/Screen01Prepare';
import { Screen02Listening } from './components/screens/Screen02Listening';
import { Screen03NextPrompt } from './components/screens/Screen03NextPrompt';
import { Screen04Generating } from './components/screens/Screen04Generating';
import { Screen05Ready } from './components/screens/Screen05Ready';
import { PixiGameRenderer } from './components/game/PixiGameRenderer';

function App() {
  const { currentScreen } = useFlowStore();

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500/30">
      {/* Basic Router-like switch based on global Zustand flow state */}
      {currentScreen === "TITLE" && <Screen00Title />}
      {currentScreen === "PREPARE" && <Screen01Prepare />}
      {currentScreen === "LISTENING" && <Screen02Listening />}
      {currentScreen === "NEXT_PROMPT" && <Screen03NextPrompt />}
      {currentScreen === "GENERATING" && <Screen04Generating />}
      {currentScreen === "READY" && <Screen05Ready />}
      {currentScreen === "PLAYING" && (
        <div className="relative w-full h-screen overflow-hidden">
          <PixiGameRenderer />

          <div className="absolute top-4 right-4 z-20" style={{ marginTop: 0 }}>
            <button
              onClick={() => useFlowStore.getState().resetFlow()}
              style={{
                padding: '8px 18px',
                borderRadius: 12,
                border: '2px solid #E74C8B',
                background: 'rgba(255,255,255,0.9)',
                color: '#E74C8B',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.2s ease',
              }}
            >
              🏠 タイトルへ戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

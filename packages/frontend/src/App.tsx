import React from 'react';
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

          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => useFlowStore.getState().resetFlow()}
              className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-sm text-white transition-colors shadow-lg"
            >
              タイトルへ戻る (諦める)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

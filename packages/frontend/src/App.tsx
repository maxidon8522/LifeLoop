import React from 'react';
import { useFlowStore } from './store/useFlowStore';

import { Screen00Title } from './components/screens/Screen00Title';
import { Screen01Prepare } from './components/screens/Screen01Prepare';
import { Screen02Listening } from './components/screens/Screen02Listening';
import { Screen03NextPrompt } from './components/screens/Screen03NextPrompt';
import { Screen04Generating } from './components/screens/Screen04Generating';
import { Screen05Ready } from './components/screens/Screen05Ready';

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
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <h1 className="text-4xl text-emerald-400 font-bold mb-4">Game Loop Canvas Here</h1>
          <p className="text-gray-400">Phase 3 の PixiJS または Three.js キャンバスがここにマウントされます。</p>
          <button
            onClick={() => useFlowStore.getState().resetFlow()}
            className="mt-8 px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-sm text-white transition-colors"
          >
            タイトルへ戻る (デバッグ用)
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

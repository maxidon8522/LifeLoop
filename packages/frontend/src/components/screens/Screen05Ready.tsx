import { useFlowStore } from '../../store/useFlowStore';
import { useGameStore } from '../../store/useGameStore';

export const Screen05Ready = () => {
    const { setScreen } = useFlowStore();
    const { board } = useGameStore();

    const handleStartGame = () => {
        setScreen("PLAYING");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 relative overflow-hidden">
            {/* Background theme effect mock */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black opacity-50 z-[-1]" />

            <h2 className="text-xl text-blue-300 font-bold mb-2 tracking-widest">
                WORLD GENERATED
            </h2>

            <h1 className="text-5xl font-extrabold mb-8 text-white drop-shadow-lg">
                {board?.world?.theme || "LifeLoop World"}
            </h1>

            <p className="text-lg text-gray-300 mb-12 max-w-md">
                トーン: {board?.world?.tone || "Mysterious"} <br />
                この世界で、あなたの物語が始まります。
            </p>

            <button
                onClick={handleStartGame}
                className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white text-2xl rounded-full font-bold shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-transform hover:scale-105 active:scale-95"
            >
                ゲーム開始
            </button>
        </div>
    );
};

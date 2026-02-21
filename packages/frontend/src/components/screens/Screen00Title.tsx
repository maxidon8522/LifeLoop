import { useFlowStore } from '../../store/useFlowStore';

export const Screen00Title = () => {
    const setScreen = useFlowStore((state) => state.setScreen);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                LifeLoop
            </h1>
            <p className="text-lg text-gray-400 mb-8">
                自己紹介から始まる、あなただけのハッカソンすごろく。
            </p>

            <button
                onClick={() => setScreen("PREPARE")}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
                はじめる
            </button>

            <div className="mt-16 text-xs text-gray-500">
                Built at Hackathon using Gemini Live API & Nano Banana
            </div>
        </div>
    );
};

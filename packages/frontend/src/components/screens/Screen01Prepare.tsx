import React from 'react';
import { useFlowStore } from '../../store/useFlowStore';

export const Screen01Prepare = () => {
    const { setScreen, currentPlayerIndex } = useFlowStore();

    const handleStartRecording = async () => {
        try {
            // Phase 1: Mock microphone permission
            // In Phase 2: await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("Mock: Mic permission granted");
            setScreen("LISTENING");
        } catch (err) {
            alert("マイクへのアクセスを許可してください");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h2 className="text-3xl font-bold mb-6">
                Player {currentPlayerIndex + 1} の自己紹介
            </h2>
            <p className="text-lg text-gray-300 mb-10 max-w-md">
                「名前・趣味・最近ハマっていること」などを自由にマイクに向かって話してください。<br />
                LifeLoop AIがあなたの特徴を抽出し、ゲームの舞台を作り上げます。
            </p>

            <button
                onClick={handleStartRecording}
                className="px-8 py-4 bg-red-500 hover:bg-red-400 text-white rounded-full font-bold text-xl flex items-center gap-2 shadow-lg shadow-red-500/30 transition-all hover:scale-105"
            >
                <span className="w-4 h-4 rounded-full bg-white animate-pulse" />
                録音を開始する
            </button>
        </div>
    );
};

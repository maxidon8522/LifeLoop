import React from 'react';
import { useFlowStore } from '../../store/useFlowStore';

export const Screen04Generating = () => {
    // Use length of players or any other stat from GameStore if desired

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-r-4 border-emerald-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>

            <h2 className="text-3xl font-bold mb-4 animate-pulse">
                世界を生成中...
            </h2>
            <p className="text-gray-400">
                AI Director がプレイヤーの個性を分析し、<br />
                特別なゲーム盤面を組み上げています。
            </p>
        </div>
    );
};

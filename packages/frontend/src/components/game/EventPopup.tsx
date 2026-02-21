import React from 'react';
import type { BoardTile, PlayerProfile } from '../../store/useGameStore';

interface EventPopupProps {
    tile: BoardTile;
    player: PlayerProfile;
    onClose: () => void;
}

export const EventPopup: React.FC<EventPopupProps> = ({ tile, onClose }) => {
    const isGood = tile.type === "bonus" || tile.type === "rescue";
    const isBad = tile.type === "penalty";

    return (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4">
            <div className={`relative max-w-sm w-full bg-gray-800 rounded-2xl shadow-2xl p-6 border-2 flex flex-col items-center text-center animate-bounce-in ${isGood ? "border-green-500 shadow-green-500/20" :
                isBad ? "border-red-500 shadow-red-500/20" : "border-blue-500 shadow-blue-500/20"
                }`}>

                <div className="text-4xl mb-4">
                    {isGood ? "🎉" : isBad ? "⚠️" : "💬"}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                    {tile.title}
                </h3>

                <p className="text-gray-300 mb-6 bg-black/30 p-3 rounded-lg w-full min-h-[4rem] flex items-center justify-center">
                    {tile.eventSeed}
                </p>

                <div className="flex flex-col w-full gap-2">
                    <div className="text-sm text-gray-400 mb-4">
                        効果: {tile.effect.type === "advance" && `+${tile.effect.value} マス進む`}
                        {tile.effect.type === "retreat" && `-${tile.effect.value} マス戻る`}
                        {tile.effect.type === "none" && "なし"}
                    </div>

                    <button
                        onClick={onClose}
                        className={`w-full py-3 rounded-xl font-bold text-white transition-all active:scale-95 ${isGood ? "bg-green-600 hover:bg-green-500" :
                            isBad ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"
                            }`}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

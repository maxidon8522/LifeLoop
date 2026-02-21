import { useFlowStore } from '../../store/useFlowStore';
import { useGameStore } from '../../store/useGameStore';
import { fallbackBoard } from '../../lib/fallbackBoard';
import { PreGameFrame } from './PreGameFrame';

export const Screen05Ready = () => {
    const { setScreen } = useFlowStore();
    const { board, players, fallbackToTemplate, setPlayerProfile } = useGameStore();

    const handleStartGame = () => {
        if (!board?.tiles?.length) {
            fallbackToTemplate(fallbackBoard);
        }
        if (players.length === 0) {
            setPlayerProfile(0, {
                displayName: "Player 1",
                tags: ["Default"],
                lifestyle: ["Standard"],
                attributes: ["Explorer"]
            });
        }
        setScreen("PLAYING");
    };

    return (
        <PreGameFrame
            badge="READY"
            title={board?.world?.theme || "LifeLoop World"}
            description={(
                <>
                    トーン: {board?.world?.tone || "Mysterious"}<br />
                    準備完了。サイコロを振って冒険を始めましょう。
                </>
            )}
        >
            <button
                onClick={handleStartGame}
                className="rounded-full border-2 border-[#4A3728]/15 bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-12 py-5 text-2xl font-black text-white shadow-[0_10px_24px_rgba(255,107,53,0.38)] transition-transform hover:scale-105 active:scale-95"
            >
                ゲーム開始
            </button>
        </PreGameFrame>
    );
};

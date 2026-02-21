import { useFlowStore } from '../../store/useFlowStore';
import { useGameStore } from '../../store/useGameStore';
import { getFallbackBoard } from '../../lib/fallbackBoard';
import { PreGameFrame } from './PreGameFrame';

export const Screen05Ready = () => {
    const { setScreen, language } = useFlowStore();
    const { board, players, fallbackToTemplate, setPlayerProfile } = useGameStore();
    const isEn = language === 'en';

    const handleStartGame = () => {
        if (!board?.tiles?.length) {
            fallbackToTemplate(getFallbackBoard(language));
        }
        if (players.length === 0) {
            setPlayerProfile(0, {
                displayName: "Player 1",
                tags: [isEn ? "Default" : "デフォルト"],
                lifestyle: [isEn ? "Standard" : "標準"],
                attributes: [isEn ? "Explorer" : "探索者"]
            });
        }
        setScreen("PLAYING");
    };

    return (
        <PreGameFrame
            badge="🎮 READY"
            title={board?.world?.theme || "LifeLoop World"}
            description={(
                <>
                    {isEn ? 'Tone' : 'トーン'}: {board?.world?.tone || "Mysterious"}<br />
                    {isEn
                        ? 'Ready! Roll the dice and begin your adventure.'
                        : '準備完了！サイコロを振って冒険を始めましょう。'}
                </>
            )}
        >
            <div className="mx-auto max-w-md space-y-6">
                {/* Player list */}
                {players.length > 0 && (
                    <div className="rounded-2xl border-[2.5px] border-[#E8D5A0] bg-white px-5 py-4">
                        <div className="mb-3 text-sm font-bold text-[#B8A07A]">{isEn ? '👥 Players' : '👥 参加プレイヤー'}</div>
                        <div className="flex flex-wrap gap-2">
                            {players.map((p, idx) => (
                                <div key={idx} className="rounded-xl border-[2px] border-[#E8D5A0] bg-[#FFFDF5] px-4 py-2 text-sm font-bold text-[#4A3728]">
                                    {['🔵', '🟡', '🟢', '🩷'][idx % 4]} {p.displayName}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Board preview */}
                <div className="rounded-2xl border-[2.5px] border-[#E8D5A0] bg-white px-5 py-4">
                    <div className="mb-2 text-sm font-bold text-[#B8A07A]">{isEn ? '🗺️ Board Info' : '🗺️ ボード情報'}</div>
                    <div className="flex gap-4 text-sm text-[#7A6850]">
                        <div>{isEn ? 'Tiles' : 'マス数'}: <span className="font-bold text-[#4A3728]">{board?.tiles?.length || '?'}</span></div>
                        <div>{isEn ? 'Theme' : 'テーマ'}: <span className="font-bold text-[#4A3728]">{board?.world?.theme || '—'}</span></div>
                    </div>
                </div>

                {/* Game start CTA */}
                <button
                    onClick={handleStartGame}
                    className="w-full rounded-2xl border-[3px] border-[#4A8C5E] px-12 py-5 text-2xl font-black text-[#2D5E3A] shadow-[0_6px_24px_rgba(74,140,94,0.25)] transition-all hover:scale-[1.02] hover:shadow-[0_10px_32px_rgba(74,140,94,0.35)] active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #7FE89B, #5BD87A)' }}
                >
                    {isEn ? '🎮 Start Game!' : '🎮 ゲーム開始！'}
                </button>
            </div>
        </PreGameFrame>
    );
};

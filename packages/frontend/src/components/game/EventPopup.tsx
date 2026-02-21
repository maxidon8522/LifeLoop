import React from 'react';
import type { BoardTile, PlayerProfile } from '../../store/useGameStore';
import { useFlowStore } from '../../store/useFlowStore';

interface EventPopupProps {
    tile: BoardTile;
    player: PlayerProfile;
    onClose: () => void;
}

export const EventPopup: React.FC<EventPopupProps> = ({ tile, player, onClose }) => {
    const { language } = useFlowStore();
    const isEn = language === 'en';
    const isGood = tile.type === 'bonus' || tile.type === 'rescue';
    const isBad = tile.type === 'penalty';

    const accentColor = isGood ? '#2ECC71' : isBad ? '#E74C8B' : '#5BC4F0';
    const bgGradient = isGood
        ? 'linear-gradient(135deg, #E8F8E8, #D4EDDA)'
        : isBad
            ? 'linear-gradient(135deg, #FDE8EE, #F8D7DA)'
            : 'linear-gradient(135deg, #E8F0F8, #D1ECF1)';

    const emoji = isGood ? '🎉' : isBad ? '⚡' : '💬';

    const effectText = (() => {
        const e = tile.effect;
        switch (e.type) {
            case 'advance': return isEn ? `+${e.value} tiles forward!` : `+${e.value} マス進む！`;
            case 'retreat': return isEn ? `-${e.value} tiles back` : `-${e.value} マス戻る`;
            case 'score': return isEn ? `+${e.value} points!` : `+${e.value} ポイント！`;
            case 'swap': return isEn ? 'Swap positions with another player!' : 'プレイヤーと位置交換！';
            case 'choice': return isEn ? 'Choice event triggered!' : '選択イベント発生！';
            default: return isEn ? 'No effect' : '効果なし';
        }
    })();

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)',
            padding: 16,
        }}>
            <div style={{
                maxWidth: 380,
                width: '100%',
                background: bgGradient,
                borderRadius: 24,
                border: `3px solid ${accentColor}`,
                boxShadow: `0 12px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.5) inset`,
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                animation: 'popIn 0.3s ease-out',
            }}>
                {/* Emoji */}
                <div style={{ fontSize: 56, marginBottom: 12, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>
                    {emoji}
                </div>

                {/* Title */}
                <h3 style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: '#4A3728',
                    marginBottom: 4,
                }}>
                    {tile.title}
                </h3>

                {/* Player indicator */}
                <div style={{
                    fontSize: 12,
                    color: '#8B7355',
                    marginBottom: 16,
                    fontWeight: 600,
                }}>
                    {isEn ? `${player.displayName}'s tile` : `${player.displayName} のマス`}
                </div>

                {/* Event description */}
                <div style={{
                    background: 'rgba(255,255,255,0.7)',
                    borderRadius: 14,
                    padding: '14px 18px',
                    width: '100%',
                    minHeight: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    color: '#4A3728',
                    fontSize: 15,
                    lineHeight: 1.5,
                    fontWeight: 500,
                }}>
                    {tile.eventSeed}
                </div>

                {/* Effect badge */}
                <div style={{
                    background: accentColor,
                    borderRadius: 20,
                    padding: '6px 20px',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    marginBottom: 20,
                    boxShadow: `0 4px 12px ${accentColor}44`,
                }}>
                    {effectText}
                </div>

                {/* OK Button */}
                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '14px 0',
                        borderRadius: 16,
                        border: 'none',
                        fontWeight: 800,
                        fontSize: 18,
                        cursor: 'pointer',
                        background: accentColor,
                        color: '#fff',
                        boxShadow: `0 4px 16px ${accentColor}40`,
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                        (e.target as HTMLButtonElement).style.transform = 'scale(1.02)';
                        (e.target as HTMLButtonElement).style.opacity = '0.9';
                    }}
                    onMouseLeave={e => {
                        (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                        (e.target as HTMLButtonElement).style.opacity = '1';
                    }}
                >
                    OK
                </button>
            </div>

            {/* Pop-in animation */}
            <style>{`
                @keyframes popIn {
                    0% { transform: scale(0.8); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

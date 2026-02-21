import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useGameStore } from '../../store/useGameStore';
import type { BoardTile } from '../../store/useGameStore';
import { EventPopup } from './EventPopup';

export const PixiGameRenderer = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { board, players, currentTurn, activePlayerIndex, movePlayer, nextTurn } = useGameStore();

    const [activeEvent, setActiveEvent] = useState<BoardTile | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [diceResult, setDiceResult] = useState<number | null>(null);

    const handleRollDice = () => {
        setIsRolling(true);
        setDiceResult(null);

        setTimeout(() => {
            const steps = Math.floor(Math.random() * 3) + 1; // 1 to 3
            setDiceResult(steps);
            setIsRolling(false);

            // move player
            movePlayer(activePlayerIndex, steps);

            setTimeout(() => {
                // show event after a tiny delay for "animation"
                const updatedPlayer = useGameStore.getState().players[activePlayerIndex];
                const tile = board?.tiles[updatedPlayer.position];
                if (tile) {
                    setActiveEvent(tile);
                }
            }, 500);
        }, 1000);
    };

    const handleCloseEvent = async () => {
        setActiveEvent(null);
        setDiceResult(null);

        let shouldRebalance = false;
        // If the last player just finished their Turn 1
        if (activePlayerIndex === players.length - 1 && currentTurn === 1) {
            shouldRebalance = true;
        }

        nextTurn();

        if (shouldRebalance) {
            console.log("Triggering AI Director Rebalance Guarantee...");
            try {
                const res = await fetch('http://localhost:3001/api/director/rebalance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ turnNumber: 1, currentScores: [], boardState: board })
                });
                const data = await res.json();
                console.log("Director Response:", data);
                if (data.action && data.details) {
                    alert(`[AI Director 介入!]\n${data.details.title}\n${data.details.description}`);
                }
            } catch (e) {
                console.error("Director failed", e);
            }
        }
    };

    useEffect(() => {
        if (!containerRef.current) return;

        // 1. Initialize PixiJS application
        const app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x111111,
            resolution: window.devicePixelRatio || 1,
        });

        containerRef.current.appendChild(app.view as HTMLCanvasElement);

        // 2. Draw basic grid/tiles
        const tilesCount = board?.tiles?.length || 10;
        const tileWidth = 60;
        const padding = 20;

        const startX = 100;
        const startY = window.innerHeight / 2;

        for (let i = 0; i < tilesCount; i++) {
            const tileData = board?.tiles[i];

            const gr = new PIXI.Graphics();

            // Color mapping by type
            let color = 0x555555;
            if (tileData?.type === "bonus") color = 0x4ade80;
            if (tileData?.type === "penalty") color = 0xf87171;
            if (tileData?.type === "goal") color = 0xfacc15;

            gr.beginFill(color);
            gr.drawRoundedRect(0, 0, tileWidth, tileWidth, 8);
            gr.endFill();

            // Position linearly for prototype
            gr.x = startX + (i * (tileWidth + padding));
            gr.y = startY - (tileWidth / 2);

            app.stage.addChild(gr);

            const text = new PIXI.Text(tileData?.title || `Tile ${i + 1}`, {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0xffffff,
                align: 'center',
                wordWrap: true,
                wordWrapWidth: tileWidth
            });
            text.x = gr.x + 5;
            text.y = gr.y - 20;
            app.stage.addChild(text);
        }

        // 3. Draw Players (Tokens)
        players.forEach((p, idx) => {
            const token = new PIXI.Graphics();
            token.beginFill(idx === 0 ? 0x60a5fa : 0xf472b6); // Blue for P1, Pink for P2
            token.drawCircle(0, 0, 15);

            // Outline active player
            if (idx === activePlayerIndex) {
                token.lineStyle(2, 0xffffff);
                token.drawCircle(0, 0, 18);
            }
            token.endFill();

            // Position based on player's current position
            const pos = p.position || 0;
            token.x = startX + (pos * (tileWidth + padding)) + (tileWidth / 2);
            token.y = startY + (idx * 20) - 10;

            app.stage.addChild(token);
        });

        // Cleanup on unmount
        return () => {
            app.destroy(true, { children: true });
        };
    }, [board, players]);

    return (
        <div ref={containerRef} className="absolute inset-0 z-0">
            {/* Top Left Status */}
            <div className="absolute top-4 left-4 z-10 bg-black/60 p-4 rounded-xl text-white shadow-lg border border-white/10">
                <h2 className="text-xl font-bold">{board?.world?.theme || "Game View"}</h2>
                <p className="text-sm text-gray-300">Turn: {currentTurn} | {players[activePlayerIndex]?.displayName}'s Turn</p>
            </div>

            {/* Bottom Dice Controller */}
            {!activeEvent && (
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center">
                    {diceResult && (
                        <div className="mb-4 text-4xl font-black text-white animate-bounce">
                            🎲 {diceResult}
                        </div>
                    )}
                    <button
                        onClick={handleRollDice}
                        disabled={isRolling}
                        className={`px-12 py-5 rounded-full font-bold text-2xl shadow-xl transition-all active:scale-95 ${isRolling
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:opacity-90 hover:scale-105"
                            }`}
                    >
                        {isRolling ? "Rolling..." : "サイコロを振る"}
                    </button>
                </div>
            )}

            {/* Event Popup Overlay */}
            {activeEvent && (
                <EventPopup
                    tile={activeEvent}
                    player={players[activePlayerIndex]}
                    onClose={handleCloseEvent}
                />
            )}
        </div>
    );
};

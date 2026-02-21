import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { useGameStore } from '../../store/useGameStore';

export const PixiGameRenderer = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { board, players } = useGameStore();

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
            token.endFill();

            token.x = startX + (tileWidth / 2);
            token.y = startY + (idx * 15);

            app.stage.addChild(token);
        });

        // Cleanup on unmount
        return () => {
            app.destroy(true, { children: true });
        };
    }, [board, players]);

    return (
        <div ref={containerRef} className="absolute inset-0 z-0">
            {/* Pixi Canvas injected here */}
            <div className="absolute top-4 left-4 z-10 bg-black/60 p-4 rounded-xl text-white">
                <h2 className="text-xl font-bold">{board?.world?.theme || "Game View"}</h2>
                <p className="text-sm">Turn: 1 (Waiting for Dice Roll)</p>
            </div>
        </div>
    );
};

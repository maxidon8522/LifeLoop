import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useGameStore } from '../../store/useGameStore';
import type { BoardTile } from '../../store/useGameStore';
import { useFlowStore } from '../../store/useFlowStore';
import type { AppLanguage } from '../../store/useFlowStore';
import { EventPopup } from './EventPopup';
import { getFallbackBoard } from '../../lib/fallbackBoard';

/* ─── Color Palette ─── */
const TILE_COLORS: Record<string, { top: number; side: number; icon: string }> = {
    normal: { top: 0x5BC4F0, side: 0x3A9FD0, icon: '💎' },
    bonus: { top: 0xFFD700, side: 0xD4A800, icon: '🎁' },
    penalty: { top: 0xE74C8B, side: 0xC03070, icon: '⚡' },
    event: { top: 0x9B59B6, side: 0x7D3F9B, icon: '❓' },
    rescue: { top: 0x2ECC71, side: 0x1FAA55, icon: '🛟' },
    goal: { top: 0xFF6B35, side: 0xD4521A, icon: '🏁' },
};

const PLAYER_COLORS = [
    { fill: 0x60A5FA, label: 'P1', emoji: '🔵' },
    { fill: 0xF59E0B, label: 'P2', emoji: '🟡' },
    { fill: 0x34D399, label: 'P3', emoji: '🟢' },
    { fill: 0xF472B6, label: 'P4', emoji: '🩷' },
];

/* ─── Layout Constants ─── */
const TILE_W = 92;
const TILE_H = 92;
const TILE_DEPTH = 14;
const COLS = 6;
const GAP_X = 16;
const GAP_Y = 16;

const summarizeTileAction = (language: AppLanguage, tile?: BoardTile): string => {
    const isEn = language === 'en';
    if (!tile) return isEn ? 'Event' : 'イベント';
    switch (tile.effect.type) {
        case 'advance':
            return isEn ? `${tile.effect.value} tiles forward` : `${tile.effect.value}マス進む`;
        case 'retreat':
            return isEn ? `${tile.effect.value} tiles back` : `${tile.effect.value}マス戻る`;
        case 'score':
            return isEn ? `Score +${tile.effect.value}` : `スコア+${tile.effect.value}`;
        case 'swap':
            return isEn ? 'Swap positions' : '位置を交換';
        case 'choice':
            return isEn ? 'Choice event' : '選択イベント';
        case 'none':
        default:
            return tile.type === 'goal'
                ? (isEn ? 'Goal!' : 'ゴール!')
                : (isEn ? 'No change' : '変化なし');
    }
};

type DecorationResponse = {
    decorations?: Array<{ imageData?: string }>;
};

const isLikelyBackgroundPixel = (r: number, g: number, b: number, a: number): boolean => {
    if (a < 8) return true;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const brightness = (r + g + b) / 3;
    return saturation < 0.18 && brightness > 165;
};

const makeTransparentDataUrl = async (src: string): Promise<string> => {
    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('image load failed'));
            img.src = src;
        });

        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx || canvas.width === 0 || canvas.height === 0) return src;

        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data, width, height } = imageData;

        const visited = new Uint8Array(width * height);
        const queue: number[] = [];

        const enqueueIfBackground = (x: number, y: number) => {
            if (x < 0 || y < 0 || x >= width || y >= height) return;
            const idx = y * width + x;
            if (visited[idx] === 1) return;

            const p = idx * 4;
            if (!isLikelyBackgroundPixel(data[p], data[p + 1], data[p + 2], data[p + 3])) return;
            visited[idx] = 1;
            queue.push(idx);
        };

        for (let x = 0; x < width; x++) {
            enqueueIfBackground(x, 0);
            enqueueIfBackground(x, height - 1);
        }
        for (let y = 1; y < height - 1; y++) {
            enqueueIfBackground(0, y);
            enqueueIfBackground(width - 1, y);
        }

        while (queue.length > 0) {
            const idx = queue.pop();
            if (idx === undefined) break;

            const x = idx % width;
            const y = Math.floor(idx / width);
            enqueueIfBackground(x - 1, y);
            enqueueIfBackground(x + 1, y);
            enqueueIfBackground(x, y - 1);
            enqueueIfBackground(x, y + 1);
        }

        for (let i = 0; i < visited.length; i++) {
            if (visited[i] === 1) data[i * 4 + 3] = 0;
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/png');
    } catch {
        return src;
    }
};

/* ─── Coordinate helper: S-shape path layout ─── */
const tilePosition = (index: number): { x: number; y: number } => {
    const row = Math.floor(index / COLS);
    let col = index % COLS;
    // Reverse every odd row for S-shape
    if (row % 2 === 1) col = COLS - 1 - col;
    const x = col * (TILE_W + GAP_X);
    const y = row * (TILE_H + GAP_Y + TILE_DEPTH);
    return { x, y };
};

/* ─── Draw a 3D-ish tile ─── */
const drawTile = (g: PIXI.Graphics, topColor: number, sideColor: number) => {
    // Side (depth)
    g.beginFill(sideColor);
    g.drawRoundedRect(0, TILE_DEPTH, TILE_W, TILE_H, 12);
    g.endFill();
    // Top
    g.beginFill(topColor);
    g.drawRoundedRect(0, 0, TILE_W, TILE_H, 12);
    g.endFill();
};

/* ─── Draw rail segment between two positions ─── */
const drawRail = (g: PIXI.Graphics, from: { x: number; y: number }, to: { x: number; y: number }) => {
    const cx1 = from.x + TILE_W / 2;
    const cy1 = from.y + TILE_H / 2;
    const cx2 = to.x + TILE_W / 2;
    const cy2 = to.y + TILE_H / 2;

    // Rail ties
    g.lineStyle(6, 0x8B7355, 0.5);
    g.moveTo(cx1, cy1);
    g.lineTo(cx2, cy2);
    // Rail lines
    g.lineStyle(2, 0xA0A0A0, 0.7);
    const dx = cx2 - cx1;
    const dy = cy2 - cy1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;
    const nx = -dy / len * 3;
    const ny = dx / len * 3;
    g.moveTo(cx1 + nx, cy1 + ny);
    g.lineTo(cx2 + nx, cy2 + ny);
    g.moveTo(cx1 - nx, cy1 - ny);
    g.lineTo(cx2 - nx, cy2 - ny);
};

/* ─── Decoration helpers (small buildings / trees drawn with Graphics) ─── */
const drawSmallHouse = (g: PIXI.Graphics, x: number, y: number, color: number) => {
    // Body
    g.beginFill(color);
    g.drawRect(x, y + 10, 24, 20);
    g.endFill();
    // Roof
    g.beginFill(0xD4521A);
    g.moveTo(x - 2, y + 10);
    g.lineTo(x + 12, y - 2);
    g.lineTo(x + 26, y + 10);
    g.closePath();
    g.endFill();
    // Door
    g.beginFill(0x6B4226);
    g.drawRect(x + 9, y + 20, 6, 10);
    g.endFill();
};

const drawTree = (g: PIXI.Graphics, x: number, y: number) => {
    // Trunk
    g.beginFill(0x8B6914);
    g.drawRect(x + 5, y + 16, 6, 14);
    g.endFill();
    // Foliage
    g.beginFill(0x2ECC71);
    g.drawCircle(x + 8, y + 12, 12);
    g.endFill();
    g.beginFill(0x27AE60);
    g.drawCircle(x + 8, y + 8, 9);
    g.endFill();
};

/* ═══════════════════════════════════════════ */
export const PixiGameRenderer = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const {
        board,
        players,
        currentTurn,
        activePlayerIndex,
        movePlayer,
        addScore,
        nextTurn,
        decorationImages,
        setDecorationImages,
        fallbackToTemplate,
        setPlayerProfile
    } = useGameStore();

    const [activeEvent, setActiveEvent] = useState<BoardTile | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [diceResult, setDiceResult] = useState<number | null>(null);
    const [pixiError, setPixiError] = useState<string | null>(null);
    const [decoLoading, setDecoLoading] = useState(false);
    const { language } = useFlowStore();
    const isEn = language === 'en';

    const appRef = useRef<PIXI.Application | null>(null);
    const tokensRef = useRef<PIXI.Container[]>([]);
    const decoContainerRef = useRef<PIXI.Container | null>(null);

    const activePlayer = players[activePlayerIndex];
    const tiles = useMemo(() => board?.tiles ?? [], [board?.tiles]);
    const totalTiles = tiles.length;
    const canRoll = !activeEvent && !isRolling && players.length > 0 && totalTiles > 0;

    /* ─── Fetch decorations on mount ─── */
    useEffect(() => {
        if (!board || decorationImages.length > 0 || decoLoading) return;

        setDecoLoading(true);
        const fetchDecorations = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/generate/decorations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        theme: board.world?.theme || 'adventure',
                        tone: board.world?.tone || 'fun',
                        artStylePrompt: board.world?.artStylePrompt || '',
                        playerProfiles: players.map(p => ({
                            displayName: p.displayName,
                            tags: p.tags,
                            lifestyle: p.lifestyle,
                        })),
                    }),
                });
                const data = await res.json() as DecorationResponse;
                const images = (data.decorations || [])
                    .filter((d): d is { imageData: string } => typeof d.imageData === 'string' && d.imageData.length > 0)
                    .map((d) => d.imageData);
                const transparentImages = await Promise.all(images.map((img) => makeTransparentDataUrl(img)));
                setDecorationImages(transparentImages);
            } catch (e) {
                console.error('[Deco] Failed to fetch decorations:', e);
            } finally {
                setDecoLoading(false);
            }
        };
        fetchDecorations();
    }, [board, decorationImages.length, decoLoading, players, setDecorationImages]);

    /* ─── Dice Roll ─── */
    const handleRollDice = useCallback(() => {
        if (!totalTiles || players.length === 0) return;
        setIsRolling(true);
        setDiceResult(null);

        setTimeout(() => {
            const steps = Math.floor(Math.random() * 3) + 1;
            setDiceResult(steps);
            setIsRolling(false);
            movePlayer(activePlayerIndex, steps);

            setTimeout(() => {
                const updatedPlayer = useGameStore.getState().players[activePlayerIndex];
                if (!updatedPlayer) return;
                const tile = tiles[updatedPlayer.position];
                if (tile) setActiveEvent(tile);
            }, 500);
        }, 1000);
    }, [activePlayerIndex, tiles, movePlayer, players.length, totalTiles]);

    /* ─── Close event ─── */
    const handleCloseEvent = async () => {
        // Apply score effect
        if (activeEvent) {
            const eff = activeEvent.effect;
            if (eff.type === 'score') {
                addScore(activePlayerIndex, eff.value);
            }
        }

        setActiveEvent(null);
        setDiceResult(null);

        let shouldRebalance = false;
        if (activePlayerIndex === players.length - 1 && currentTurn === 1) {
            shouldRebalance = true;
        }
        nextTurn();

        if (shouldRebalance) {
            try {
                const res = await fetch('http://localhost:3001/api/director/rebalance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ turnNumber: 1, currentScores: [], boardState: board })
                });
                const data = await res.json();
                if (data.action && data.details) {
                    alert(
                        isEn
                            ? `[AI Director Intervention!]\n${data.details.title}\n${data.details.description}`
                            : `[AI Director 介入!]\n${data.details.title}\n${data.details.description}`
                    );
                }
            } catch (e) {
                console.error('Director failed', e);
            }
        }
    };

    /* ─── Initialize PixiJS ─── */
    useEffect(() => {
        const container = containerRef.current;
        if (!container || appRef.current) {
            return;
        }
        if (!totalTiles) {
            fallbackToTemplate(getFallbackBoard(language));
            return;
        }
        if (players.length === 0) {
            setPlayerProfile(0, {
                displayName: 'Player 1',
                tags: [isEn ? 'Default' : 'デフォルト'],
                lifestyle: [isEn ? 'Standard' : '標準'],
                attributes: [isEn ? 'Explorer' : '探索者'],
            });
            return;
        }

        setPixiError(null);
        tokensRef.current = [];
        container.innerHTML = '';

        try {
            const app = new PIXI.Application({
                width: window.innerWidth,
                height: window.innerHeight,
                backgroundColor: 0x7EC850, // green grass
                resolution: window.devicePixelRatio || 1,
                antialias: true,
            });

            const canvas = (app as unknown as { view?: HTMLCanvasElement; canvas?: HTMLCanvasElement }).view
                ?? (app as unknown as { view?: HTMLCanvasElement; canvas?: HTMLCanvasElement }).canvas;
            if (!canvas) throw new Error('PIXI canvas not found');

            container.appendChild(canvas);
            appRef.current = app;

            // Main board container (scrollable / pannable)
            const boardContainer = new PIXI.Container();
            app.stage.addChild(boardContainer);

            // Calculate board size for centering
            const lastPos = tilePosition(totalTiles - 1);
            const boardW = COLS * (TILE_W + GAP_X);
            const boardH = lastPos.y + TILE_H + TILE_DEPTH + 40;
            const offsetX = Math.max(40, (window.innerWidth - boardW) / 2);
            const offsetY = Math.max(40, (window.innerHeight - boardH) / 2);
            boardContainer.x = offsetX;
            boardContainer.y = offsetY;

            // Grass pattern (subtle grid)
            const grassBg = new PIXI.Graphics();
            grassBg.beginFill(0x6DB840, 0.3);
            for (let gx = -100; gx < boardW + 100; gx += 50) {
                for (let gy = -100; gy < boardH + 100; gy += 50) {
                    grassBg.drawCircle(gx + Math.random() * 10, gy + Math.random() * 10, 2 + Math.random() * 3);
                }
            }
            grassBg.endFill();
            boardContainer.addChild(grassBg);

            // Rails layer
            const railsLayer = new PIXI.Graphics();
            boardContainer.addChild(railsLayer);

            for (let i = 0; i < totalTiles - 1; i++) {
                const from = tilePosition(i);
                const to = tilePosition(i + 1);
                drawRail(railsLayer, from, to);
            }

            // Decoration container for Nanobanana sprites
            const decoContainer = new PIXI.Container();
            boardContainer.addChild(decoContainer);
            decoContainerRef.current = decoContainer;

            // Static decorations (small houses and trees around the path)
            const staticDecoG = new PIXI.Graphics();
            boardContainer.addChild(staticDecoG);

            const decoPositions = [
                { x: -60, y: 20 }, { x: boardW + 10, y: 50 },
                { x: -40, y: boardH / 2 }, { x: boardW + 20, y: boardH / 2 - 30 },
                { x: 30, y: -40 }, { x: boardW - 80, y: boardH + 10 },
            ];
            decoPositions.forEach((pos, i) => {
                if (i % 2 === 0) {
                    drawSmallHouse(staticDecoG, pos.x, pos.y, [0xFFE4B5, 0xE0E0E0, 0xADD8E6][i % 3]);
                } else {
                    drawTree(staticDecoG, pos.x, pos.y);
                }
            });

            // Tiles layer
            for (let i = 0; i < totalTiles; i++) {
                const tileData = tiles[i];
                const pos = tilePosition(i);
                const colors = TILE_COLORS[tileData?.type || 'normal'] || TILE_COLORS.normal;

                const tileG = new PIXI.Graphics();
                drawTile(tileG, colors.top, colors.side);
                tileG.x = pos.x;
                tileG.y = pos.y;
                boardContainer.addChild(tileG);

                // Tile icon
                const icon = new PIXI.Text(colors.icon, {
                    fontSize: 18,
                    align: 'center',
                });
                icon.anchor.set(0.5);
                icon.x = pos.x + TILE_W / 2;
                icon.y = pos.y + 16;
                boardContainer.addChild(icon);

                // Tile number
                const numText = new PIXI.Text(`${i + 1}`, {
                    fontFamily: 'Arial',
                    fontSize: 10,
                    fill: 0xFFFFFF,
                    fontWeight: 'bold',
                });
                numText.anchor.set(0.5);
                numText.x = pos.x + TILE_W - 10;
                numText.y = pos.y + 10;
                boardContainer.addChild(numText);

                // White text: tile title + action
                const titleText = new PIXI.Text(tileData?.title || (isEn ? `Tile ${i + 1}` : `マス${i + 1}`), {
                    fontFamily: 'Arial',
                    fontSize: 10,
                    fill: 0xFFFFFF,
                    fontWeight: 'bold',
                    align: 'center',
                    wordWrap: true,
                    wordWrapWidth: TILE_W - 10,
                });
                titleText.anchor.set(0.5, 0);
                titleText.x = pos.x + TILE_W / 2;
                titleText.y = pos.y + 28;
                boardContainer.addChild(titleText);

                const effectText = new PIXI.Text(summarizeTileAction(language, tileData), {
                    fontFamily: 'Arial',
                    fontSize: 9,
                    fill: 0xFFFFFF,
                    align: 'center',
                    wordWrap: true,
                    wordWrapWidth: TILE_W - 10,
                });
                effectText.anchor.set(0.5, 0);
                effectText.x = pos.x + TILE_W / 2;
                effectText.y = pos.y + TILE_H - 22;
                boardContainer.addChild(effectText);
            }

        } catch (error) {
            console.error('[PIXI] Failed to initialize renderer', error);
            setPixiError(isEn ? 'Failed to initialize renderer.' : '描画の初期化に失敗しました。');
        }

        return () => {
            appRef.current?.destroy(true, { children: true });
            appRef.current = null;
            tokensRef.current = [];
            decoContainerRef.current = null;
            container.innerHTML = '';
        };
    }, [board, totalTiles, tiles, players.length, fallbackToTemplate, setPlayerProfile, language, isEn]);

    /* ─── Load Nanobanana decoration sprites ─── */
    useEffect(() => {
        const decoContainer = decoContainerRef.current;
        if (!decoContainer || decorationImages.length === 0) return;

        // Clear existing
        decoContainer.removeChildren();

        const lastPos = tilePosition(totalTiles - 1);
        const boardH = lastPos.y + TILE_H + TILE_DEPTH + 40;
        const boardW = COLS * (TILE_W + GAP_X);

        decorationImages.forEach((dataUrl, idx) => {
            try {
                const texture = PIXI.Texture.from(dataUrl);
                const sprite = new PIXI.Sprite(texture);
                sprite.width = 192;
                sprite.height = 192;

                // Position decorations around the board edges
                const angle = (idx / decorationImages.length) * Math.PI * 2;
                sprite.x = boardW / 2 + Math.cos(angle) * (boardW / 2 + 30) - 96;
                sprite.y = boardH / 2 + Math.sin(angle) * (boardH / 2 + 20) - 96;

                decoContainer.addChild(sprite);
            } catch (e) {
                console.error('[Deco] Failed to load decoration sprite:', e);
            }
        });
    }, [decorationImages, totalTiles]);

    /* ─── Update player tokens ─── */
    useEffect(() => {
        const app = appRef.current;
        if (!app || !totalTiles) return;

        const boardContainer = app.stage.children[0] as PIXI.Container;
        if (!boardContainer) return;

        // Rebuild tokens if player count changed
        if (tokensRef.current.length !== players.length) {
            tokensRef.current.forEach(t => {
                boardContainer.removeChild(t);
                t.destroy({ children: true });
            });
            tokensRef.current = players.map(() => {
                const c = new PIXI.Container();
                boardContainer.addChild(c);
                return c;
            });
        }

        players.forEach((p, idx) => {
            const tokenContainer = tokensRef.current[idx];
            if (!tokenContainer) return;

            // Clear and redraw
            tokenContainer.removeChildren();

            const color = PLAYER_COLORS[idx % PLAYER_COLORS.length].fill;
            const isActive = idx === activePlayerIndex;

            const g = new PIXI.Graphics();

            // Shadow
            g.beginFill(0x000000, 0.15);
            g.drawEllipse(0, 5, 14, 6);
            g.endFill();

            // Token body
            if (isActive) {
                g.lineStyle(3, 0xFFFFFF);
            }
            g.beginFill(color);
            g.drawCircle(0, -4, 14);
            g.endFill();

            tokenContainer.addChild(g);

            // Player label
            const label = new PIXI.Text(PLAYER_COLORS[idx % PLAYER_COLORS.length].emoji, {
                fontSize: 14,
                align: 'center',
            });
            label.anchor.set(0.5);
            label.y = -6;
            tokenContainer.addChild(label);

            // Position based on tile
            const pos = p.position || 0;
            const tilePos = tilePosition(pos);
            tokenContainer.x = tilePos.x + TILE_W / 2 + (idx - players.length / 2) * 12;
            tokenContainer.y = tilePos.y - 14 + (idx * 4);

            // Bounce animation for active player
            if (isActive) {
                tokenContainer.y -= 6;
            }
        });
    }, [players, activePlayerIndex, totalTiles]);

    /* ─── Keyboard controls ─── */
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.repeat || !canRoll) return;
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                handleRollDice();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [canRoll, handleRollDice]);

    /* ─── Remaining tiles calculation ─── */
    const remainingTiles = activePlayer
        ? Math.max(0, totalTiles - 1 - (activePlayer.position || 0))
        : totalTiles;
    const currentTile = activePlayer && totalTiles > 0
        ? tiles[Math.min(activePlayer.position || 0, totalTiles - 1)]
        : null;

    /* ═══ RENDER ═══ */
    return (
        <div ref={containerRef} className="absolute inset-0 z-0">

            {/* ─── HUD Top-Left: Progress ─── */}
            <div className="absolute top-4 left-4 z-20">
                <div style={{
                    background: 'linear-gradient(135deg, #FFF8DC, #FFFACD)',
                    border: '3px solid #DAA520',
                    borderRadius: 16,
                    padding: '12px 20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    minWidth: 200,
                }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: '#8B7355', fontWeight: 600 }}>{isEn ? 'Turn' : 'ターン'}</div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#4A3728' }}>{currentTurn}</div>
                        </div>
                        <div style={{ width: 1, height: 40, background: '#DAA520' }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: '#8B7355', fontWeight: 600 }}>{isEn ? 'To Goal' : 'ゴールまで'}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                                <span style={{ fontSize: 28, fontWeight: 900, color: '#4A3728' }}>{remainingTiles}</span>
                                <span style={{ fontSize: 12, color: '#8B7355', fontWeight: 600 }}>{isEn ? 'tiles' : 'マス'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* World Theme Label */}
                <div style={{
                    marginTop: 8,
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: 10,
                    padding: '6px 14px',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: 'center',
                    backdropFilter: 'blur(4px)',
                }}>
                    🌍 {board?.world?.theme || 'Game World'}
                </div>
                {currentTile && (
                    <div style={{
                        marginTop: 8,
                        background: 'rgba(0,0,0,0.65)',
                        borderRadius: 10,
                        padding: '8px 12px',
                        color: '#fff',
                        fontSize: 12,
                        lineHeight: 1.4,
                        backdropFilter: 'blur(4px)',
                    }}>
                        {isEn
                            ? `Position: tile ${activePlayer ? (activePlayer.position || 0) + 1 : 1} "${currentTile.title}"`
                            : `現在地: ${activePlayer ? (activePlayer.position || 0) + 1 : 1}マス目「${currentTile.title}」`}
                        <br />
                        {isEn ? 'Effect' : '効果'}: {summarizeTileAction(language, currentTile)}
                    </div>
                )}
            </div>

            {/* ─── HUD Top-Right: Player Info ─── */}
            <div className="absolute top-4 right-4 z-20" style={{ minWidth: 180 }}>
                {players.map((player, idx) => {
                    const isActive = idx === activePlayerIndex;
                    return (
                        <div key={`${player.displayName}-${idx}`} style={{
                            background: isActive
                                ? 'linear-gradient(135deg, #FFF8DC, #FFFACD)'
                                : 'rgba(255,255,255,0.85)',
                            border: isActive ? '3px solid #DAA520' : '2px solid #E0E0E0',
                            borderRadius: 14,
                            padding: '10px 16px',
                            marginBottom: 8,
                            boxShadow: isActive ? '0 4px 16px rgba(218,165,32,0.3)' : '0 2px 6px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s ease',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 18 }}>{PLAYER_COLORS[idx % PLAYER_COLORS.length].emoji}</span>
                                <span style={{
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: '#4A3728',
                                }}>
                                    {player.displayName}
                                    {isActive && <span style={{ marginLeft: 6, fontSize: 10, color: '#DAA520' }}>{isEn ? '▶ TURN' : '▶ 手番'}</span>}
                                </span>
                            </div>
                            <div style={{
                                display: 'flex', gap: 8,
                            }}>
                                <div style={{
                                    background: '#2ECC71',
                                    borderRadius: 8,
                                    padding: '2px 10px',
                                    color: '#fff',
                                    fontSize: 13,
                                    fontWeight: 700,
                                }}>
                                    {player.score || 0} pt
                                </div>
                                <div style={{
                                    background: '#5BC4F0',
                                    borderRadius: 8,
                                    padding: '2px 10px',
                                    color: '#fff',
                                    fontSize: 13,
                                    fontWeight: 700,
                                }}>
                                    📍 {(player.position || 0) + 1}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ─── Dice Controller (Bottom Center) ─── */}
            {!activeEvent && (
                <div className="absolute bottom-6 left-1/2 z-30" style={{
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.92)',
                    border: '3px solid #DAA520',
                    borderRadius: 24,
                    padding: '16px 32px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(8px)',
                }}>
                    {diceResult && (
                        <div style={{
                            fontSize: 48,
                            fontWeight: 900,
                            color: '#4A3728',
                            marginBottom: 8,
                            animation: 'bounce 0.5s ease',
                        }}>
                            🎲 {diceResult}
                        </div>
                    )}
                    <button
                        onClick={handleRollDice}
                        disabled={!canRoll}
                        style={{
                            padding: '14px 48px',
                            borderRadius: 50,
                            border: 'none',
                            fontWeight: 800,
                            fontSize: 20,
                            cursor: canRoll ? 'pointer' : 'not-allowed',
                            background: isRolling
                                ? '#CCC'
                                : 'linear-gradient(135deg, #FF6B35, #FFD700)',
                            color: isRolling ? '#888' : '#fff',
                            boxShadow: isRolling ? 'none' : '0 4px 20px rgba(255,107,53,0.4)',
                            transition: 'all 0.3s ease',
                            transform: canRoll && !isRolling ? 'scale(1)' : 'scale(0.95)',
                        }}
                    >
                        {isRolling ? '🎲 Rolling...' : (isEn ? '🎲 Roll Dice' : '🎲 サイコロを振る')}
                    </button>
                    <p style={{ marginTop: 6, fontSize: 11, color: '#999' }}>
                        {isEn ? 'You can also roll with Space / Enter' : 'Space / Enter キーでも振れます'}
                    </p>
                </div>
            )}

            {/* ─── Decoration loading indicator ─── */}
            {decoLoading && (
                <div className="absolute bottom-4 left-4 z-20" style={{
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: 12,
                    padding: '8px 16px',
                    color: '#fff',
                    fontSize: 12,
                    backdropFilter: 'blur(4px)',
                }}>
                    {isEn ? '🎨 Generating decorations...' : '🎨 デコレーション生成中...'}
                </div>
            )}

            {/* ─── Error overlay ─── */}
            {pixiError && (
                <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
                    <div style={{
                        borderRadius: 16,
                        border: '2px solid #E74C8B',
                        background: 'rgba(231,76,139,0.15)',
                        padding: '20px 30px',
                        color: '#FFB6C1',
                        fontSize: 16,
                    }}>
                        {pixiError}
                    </div>
                </div>
            )}

            {/* ─── Event Popup ─── */}
            {activeEvent && activePlayer && (
                <EventPopup
                    tile={activeEvent}
                    player={activePlayer}
                    onClose={handleCloseEvent}
                />
            )}
        </div>
    );
};

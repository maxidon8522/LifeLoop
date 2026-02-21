import { Request, Response } from 'express';
import { ai, MODELS, SYSTEM_INSTRUCTION } from '../services/gemini';
import { Type, Schema } from '@google/genai';

type TileType = "normal" | "bonus" | "penalty" | "event" | "rescue" | "goal";
type EffectType = "advance" | "retreat" | "score" | "swap" | "choice" | "none";

interface BoardTile {
    id: number;
    title: string;
    type: TileType;
    eventSeed: string;
    effect: {
        type: EffectType;
        value: number;
    };
    iconPrompt: string;
}

interface BoardSpec {
    world: {
        theme: string;
        tone: string;
        artStylePrompt: string;
    };
    tiles: BoardTile[];
}

const BASE_TEMPLATE_TILES: Omit<BoardTile, 'id'>[] = [
    { title: "朝礼スタート", type: "normal", eventSeed: "今日の目標を宣言して士気アップ", effect: { type: "none", value: 0 }, iconPrompt: "Morning standup with whiteboard" },
    { title: "環境構築", type: "event", eventSeed: "依存関係の地雷を回避できた", effect: { type: "advance", value: 1 }, iconPrompt: "Terminal setup check marks" },
    { title: "仕様迷子", type: "penalty", eventSeed: "要件を読み直して1マス戻る", effect: { type: "retreat", value: 1 }, iconPrompt: "Confused roadmap and sticky notes" },
    { title: "神レビュー", type: "bonus", eventSeed: "レビューで改善点が一気に見えた", effect: { type: "advance", value: 2 }, iconPrompt: "Code review with green checks" },
    { title: "集中ゾーン", type: "normal", eventSeed: "無音タイムで実装が進む", effect: { type: "none", value: 0 }, iconPrompt: "Focused coding with headphones" },
    { title: "ビルド失敗", type: "penalty", eventSeed: "型エラー祭りで足止め", effect: { type: "retreat", value: 2 }, iconPrompt: "Failed CI and red warning" },
    { title: "助っ人参上", type: "rescue", eventSeed: "チームメイトの助言で復活", effect: { type: "advance", value: 2 }, iconPrompt: "Teammate helping fix bug" },
    { title: "デモ練習", type: "event", eventSeed: "発表台本がまとまり自信がついた", effect: { type: "advance", value: 1 }, iconPrompt: "Pitch practice with timer" },
    { title: "最終調整", type: "normal", eventSeed: "UIの見た目を整えて完成度アップ", effect: { type: "none", value: 0 }, iconPrompt: "UI polish and color palette" },
    { title: "ピッチ本番", type: "goal", eventSeed: "審査員へ最高のデモを披露", effect: { type: "none", value: 0 }, iconPrompt: "Hackathon stage spotlight" }
];

const TILE_TYPES: TileType[] = ["normal", "bonus", "penalty", "event", "rescue", "goal"];
const EFFECT_TYPES: EffectType[] = ["advance", "retreat", "score", "swap", "choice", "none"];

const clampTileCount = (value: number) => Math.min(24, Math.max(8, value));

const safeText = (value: unknown, fallback: string, maxLen: number): string => {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim();
    if (!normalized) return fallback;
    return normalized.slice(0, maxLen);
};

const safeTileType = (value: unknown, fallback: TileType, forceGoal: boolean): TileType => {
    if (forceGoal) return "goal";
    if (typeof value !== 'string') return fallback;
    return TILE_TYPES.includes(value as TileType) ? (value as TileType) : fallback;
};

const safeEffectType = (value: unknown, fallback: EffectType): EffectType => {
    if (typeof value !== 'string') return fallback;
    return EFFECT_TYPES.includes(value as EffectType) ? (value as EffectType) : fallback;
};

const createTemplateBoard = (requestedTileCount: number): BoardSpec => {
    const tileCount = clampTileCount(requestedTileCount);
    const tiles: BoardTile[] = Array.from({ length: tileCount }, (_, idx) => {
        const source = BASE_TEMPLATE_TILES[idx % BASE_TEMPLATE_TILES.length];
        const isLast = idx === tileCount - 1;
        return {
            id: idx + 1,
            title: isLast ? "ピッチ本番" : source.title,
            type: isLast ? "goal" : source.type,
            eventSeed: isLast ? "審査員へ最高のデモを披露" : source.eventSeed,
            effect: isLast ? { type: "none", value: 0 } : source.effect,
            iconPrompt: source.iconPrompt
        };
    });

    return {
        world: {
            theme: "ハッカソン緊急リカバリー作戦",
            tone: "ドタバタ",
            artStylePrompt: "Colorful hackathon command center with sticky notes, laptops, and cheerful chaos"
        },
        tiles
    };
};

const parseModelJson = (raw: string): unknown => {
    const trimmed = raw.trim();
    const withoutFence = trimmed
        .replace(/^```json/i, '')
        .replace(/^```/i, '')
        .replace(/```$/, '')
        .trim();
    return JSON.parse(withoutFence);
};

const normalizeBoard = (candidate: unknown, requestedTileCount: number): BoardSpec => {
    const fallback = createTemplateBoard(requestedTileCount);
    if (!candidate || typeof candidate !== 'object') {
        return fallback;
    }

    const input = candidate as { world?: Record<string, unknown>; tiles?: unknown[] };
    const sourceTiles = Array.isArray(input.tiles) ? input.tiles : [];

    const tiles: BoardTile[] = fallback.tiles.map((fallbackTile, idx) => {
        const tile = sourceTiles[idx] as Record<string, unknown> | undefined;
        const isLast = idx === fallback.tiles.length - 1;
        const fallbackEffect = fallbackTile.effect;
        const tileEffect = tile?.effect as Record<string, unknown> | undefined;

        return {
            id: idx + 1,
            title: safeText(tile?.title, fallbackTile.title, 15),
            type: safeTileType(tile?.type, fallbackTile.type, isLast),
            eventSeed: safeText(tile?.eventSeed, fallbackTile.eventSeed, 40),
            effect: {
                type: isLast
                    ? "none"
                    : safeEffectType(tileEffect?.type, fallbackEffect.type),
                value: isLast
                    ? 0
                    : Number.isFinite(tileEffect?.value)
                        ? Number(tileEffect?.value)
                        : fallbackEffect.value
            },
            iconPrompt: safeText(tile?.iconPrompt, fallbackTile.iconPrompt, 80)
        };
    });

    return {
        world: {
            theme: safeText(input.world?.theme, fallback.world.theme, 36),
            tone: safeText(input.world?.tone, fallback.world.tone, 30),
            artStylePrompt: safeText(input.world?.artStylePrompt, fallback.world.artStylePrompt, 200)
        },
        tiles
    };
};

export const generateBoard = async (req: Request, res: Response) => {
    try {
        const { players, sessionMinutes } = req.body;

        if (!players || !Array.isArray(players)) {
            return res.status(400).json({ error: 'players array is required' });
        }

        const minutes = sessionMinutes || 10;
        const tileCount = clampTileCount(minutes === 10 ? 10 : 22); // 10 mins = ~10 tiles, 60 mins = ~22 tiles
        const fallbackBoard = createTemplateBoard(tileCount);
        console.log(`[Text API] Generating board for ${players.length} players (${minutes} min, ${tileCount} tiles)...`);

        const responseSchema: Schema = {
            type: Type.OBJECT,
            properties: {
                world: {
                    type: Type.OBJECT,
                    properties: {
                        theme: { type: Type.STRING, description: "Theme based on player profiles" },
                        tone: { type: Type.STRING, description: "Tone of the game" },
                        artStylePrompt: { type: Type.STRING, description: "Prompt for Nano Banana background generation" }
                    },
                    required: ["theme", "tone", "artStylePrompt"]
                },
                tiles: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.INTEGER },
                            title: { type: Type.STRING, description: "Max 15 chars" },
                            type: { type: Type.STRING, enum: ["normal", "bonus", "penalty", "event", "rescue", "goal"] },
                            eventSeed: { type: Type.STRING, description: "Max 40 chars. Do not include medical/personality typing." },
                            effect: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, enum: ["advance", "retreat", "score", "swap", "choice", "none"] },
                                    value: { type: Type.INTEGER }
                                },
                                required: ["type", "value"]
                            },
                            iconPrompt: { type: Type.STRING, description: "Prompt for Nano Banana icon" }
                        },
                        required: ["id", "title", "type", "eventSeed", "effect", "iconPrompt"]
                    }
                }
            },
            required: ["world", "tiles"]
        };

        const prompt = `
      以下のプレイヤープロフィールを元に、全員が楽しめるすごろくの盤面（BoardSpec）を生成してください。
      マス数（tiles）は正確に ${tileCount} 個生成し、最後のマスは id:${tileCount}, type:'goal' としてください。
      
      【プレイヤー一覧】
      ${JSON.stringify(players, null, 2)}
    `;

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), 2500);
        });

        try {
            const response = await Promise.race([
                ai.models.generateContent({
                    model: MODELS.TEXT,
                    contents: prompt,
                    config: {
                        systemInstruction: SYSTEM_INSTRUCTION,
                        responseMimeType: 'application/json',
                        responseSchema: responseSchema,
                    }
                }),
                timeoutPromise
            ]) as any;

            const resultText = typeof response?.text === 'string' ? response.text : '';
            if (!resultText) {
                throw new Error("Empty response from Gemini");
            }

            const parsed = parseModelJson(resultText);
            const boardData = normalizeBoard(parsed, tileCount);
            res.status(200).json(boardData);

        } catch (genError: any) {
            if (genError.message === 'TIMEOUT') {
                console.warn("[Text API] Board generation timed out (2.5s)!");
                return res.status(206).json(fallbackBoard);
            }
            console.error("[Text API] Board generation failed, using fallback:", genError);
            return res.status(206).json(fallbackBoard);
        }

    } catch (error: any) {
        console.error("[Text API Error]", error);
        const fallbackBoard = createTemplateBoard(10);
        res.status(206).json(fallbackBoard);
    }
};

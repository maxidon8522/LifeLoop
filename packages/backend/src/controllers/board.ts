import { Request, Response } from 'express';
import { ai, MODELS, SYSTEM_INSTRUCTION } from '../services/gemini';
import { Type, Schema } from '@google/genai';

export const generateBoard = async (req: Request, res: Response) => {
    try {
        const { players, sessionMinutes } = req.body;

        if (!players || !Array.isArray(players)) {
            return res.status(400).json({ error: 'players array is required' });
        }

        const minutes = sessionMinutes || 10;
        const tileCount = minutes === 10 ? 10 : 22; // 10 mins = ~10 tiles, 60 mins = ~22 tiles
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

            const resultText = response.text;
            if (!resultText) {
                throw new Error("Empty response from Gemini");
            }

            const boardData = JSON.parse(resultText);
            res.json(boardData);

        } catch (genError: any) {
            if (genError.message === 'TIMEOUT') {
                console.warn("[Text API] Board generation timed out (2.5s)!");
                throw genError;
            }
            throw genError;
        }

    } catch (error: any) {
        if (error.message === 'TIMEOUT') {
            res.status(504).json({ error: 'Generation Timeout', needsFallback: true });
        } else {
            console.error("[Text API Error]", error);
            res.status(500).json({ error: 'Failed to generate board', needsFallback: true });
        }
    }
};

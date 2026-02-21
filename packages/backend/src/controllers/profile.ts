import { Request, Response } from 'express';
import { ai, MODELS, SYSTEM_INSTRUCTION } from '../services/gemini';
import { Type, Schema } from '@google/genai';

export const generateProfile = async (req: Request, res: Response) => {
    try {
        const { playerIndex, transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'Transcript is required' });
        }

        console.log(`[Text API] Generating profile for player ${playerIndex}...`);

        const responseSchema: Schema = {
            type: Type.OBJECT,
            properties: {
                displayName: { type: Type.STRING },
                tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Max 5 tags, max 20 characters each."
                },
                lifestyle: { type: Type.ARRAY, items: { type: Type.STRING } },
                attributes: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["displayName", "tags", "lifestyle", "attributes"]
        };

        const prompt = `
      以下の自己紹介テキストから、プレイヤーのプロフィール（ニックネーム、趣味・関心タグ、ライフスタイル、属性）を抽出してください。
      
      【自己紹介テキスト】
      ${transcript}
    `;

        const response = await ai.models.generateContent({
            model: MODELS.TEXT,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            }
        });

        const resultText = response.text;
        if (!resultText) {
            throw new Error("Empty response from Gemini");
        }

        const profileData = JSON.parse(resultText);

        res.json({
            playerIndex: playerIndex ?? 0,
            profile: profileData
        });

    } catch (error) {
        console.error("[Text API Error]", error);
        res.status(500).json({ error: 'Failed to generate profile' });
    }
};

import { Request, Response } from 'express';
import { ai, MODELS, SYSTEM_INSTRUCTION } from '../services/gemini';
import { Type, Schema } from '@google/genai';

export const triggerRebalance = async (req: Request, res: Response) => {
    try {
        const { turnNumber, currentScores, boardState } = req.body;

        // AI Director Threshold (P0 Demo Requirement): For 10 min demos, after Turn 1, force a rescue or penalty event.
        // In a real implementation this would check session length, here we just force it if turnNumber === 1.
        const isDemoGuaranteeTriggered = turnNumber === 1;

        console.log(`[AI Director] Rebalance trigger checked (Turn: ${turnNumber}). Guarantee: ${isDemoGuaranteeTriggered}`);

        if (!isDemoGuaranteeTriggered) {
            // If no rebalance is strictly needed right now, we can just return a "no action" flag.
            return res.json({ action: "none", message: "No rebalance needed at this time." });
        }

        // Force a rebalance event calculation using Text API
        const responseSchema: Schema = {
            type: Type.OBJECT,
            properties: {
                action: { type: Type.STRING, enum: ["inject_tile", "global_buff", "global_nerf"] },
                details: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        targetTileId: { type: Type.INTEGER }
                    },
                    required: ["title", "description", "targetTileId"]
                }
            },
            required: ["action", "details"]
        };

        const prompt = `
      現在ターン1が終了しました。盛り上げるために、ゲーム盤面の特定のマス（ID: 2〜4あたり）を
      「全員が1マス進む」などの強力なイベントマス（Rescue/Bonus）に書き換える Rebalance 措置を提案してください。
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
            throw new Error("Empty AI Director Response");
        }

        const rebalanceData = JSON.parse(resultText);

        res.json({
            action: rebalanceData.action,
            details: rebalanceData.details,
            isGuaranteeTriggered: true
        });

    } catch (error) {
        console.error("[AI Director Error]", error);
        res.status(500).json({ error: 'Failed to process AI Director rebalance' });
    }
};

import { Request, Response } from 'express';
import { ai, MODELS, SYSTEM_INSTRUCTION } from '../services/gemini';

export const generateImages = async (req: Request, res: Response) => {
    try {
        const { artStylePrompt, tiles } = req.body;

        if (!tiles || !Array.isArray(tiles)) {
            return res.status(400).json({ error: 'tiles array is required' });
        }

        console.log(`[Nano Banana] Generating images for style: ${artStylePrompt}`);

        // Since this is a hackathon, we simulate a background job handling by resolving immediately
        // or generating images on the fly. We'll use the Image API for just the world background
        // and a few key tiles to stay within limits.

        // Let's generate a background image
        const bgPrompt = `Pixel art or 2.5d game background. Theme: ${artStylePrompt || "A generic hackathon venue"}. No text.`;

        // Asynchronous background job simulation for generating these
        // Normally we would use ai.models.generateImages( ... )
        // Wait, the SDK has generateImages:
        /*
        const response = await ai.models.generateImages({
          model: MODELS.IMAGE,
          prompt: bgPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg'
          }
        });
        */

        // For phase 3 we'll return mock URLs because actual image gen takes 10+ seconds and blocks the demo experience without a WebSocket ping
        res.json({
            status: "processing",
            images: {
                background: "https://placehold.co/1024x768?text=Generating+Background",
                tiles: tiles.map((t: any) => ({
                    id: t.id,
                    url: `https://placehold.co/256x256?text=Tile+${t.id}`
                }))
            }
        });

    } catch (error) {
        console.error("[Image API Error]", error);
        res.status(500).json({ error: 'Failed to generate images' });
    }
};

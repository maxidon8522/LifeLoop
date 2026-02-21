import { Request, Response } from 'express';
import { ai, MODELS } from '../services/gemini';

const generateSingleImage = async (prompt: string, timeoutMs: number): Promise<string | null> => {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const response = await ai.models.generateContent({
            model: MODELS.IMAGE,
            contents: prompt,
            config: {
                responseModalities: ['Image'],
            }
        });

        clearTimeout(timeout);

        const parts = response.candidates?.[0]?.content?.parts;
        if (!parts) return null;

        for (const part of parts) {
            if (part.inlineData?.data) {
                const mimeType = part.inlineData.mimeType || 'image/png';
                return `data:${mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error('[Nano Banana] Single image generation failed:', error);
        return null;
    }
};

export const generateImages = async (req: Request, res: Response) => {
    try {
        const { artStylePrompt, tiles } = req.body;

        if (!tiles || !Array.isArray(tiles)) {
            return res.status(400).json({ error: 'tiles array is required' });
        }

        console.log(`[Nano Banana] Generating images for style: ${artStylePrompt}`);

        // 1. Generate board background image
        const bgPrompt = `2.5D isometric game board background, bird's eye view, green grass field with pathways, cute and colorful style. Theme: ${artStylePrompt || "A fun adventure world"}. 16:9 aspect ratio. No text, no UI elements.`;

        // 2. Generate tile icon images (limit to 6 unique types to stay within rate limits)
        const uniqueTileTypes = new Map<string, { id: number; prompt: string }>();
        for (const tile of tiles) {
            if (!uniqueTileTypes.has(tile.type) && uniqueTileTypes.size < 6) {
                uniqueTileTypes.set(tile.type, {
                    id: tile.id,
                    prompt: `Small 2.5D isometric game tile icon, cute flat illustration, ${tile.iconPrompt || tile.title}. No text, no background.`
                });
            }
        }

        // Generate background + tile icons in parallel
        const bgPromise = generateSingleImage(bgPrompt, 15000);

        const tilePromises = Array.from(uniqueTileTypes.entries()).map(
            async ([type, { id, prompt }]) => ({
                type,
                id,
                imageData: await generateSingleImage(prompt, 15000)
            })
        );

        const [bgResult, ...tileResults] = await Promise.all([
            bgPromise,
            ...tilePromises
        ]);

        // Map tile type images back to all tiles
        const tileImageMap = new Map<string, string | null>();
        for (const result of tileResults) {
            tileImageMap.set(result.type, result.imageData);
        }

        const tileImages = tiles.map((t: any) => ({
            id: t.id,
            type: t.type,
            imageData: tileImageMap.get(t.type) || null
        }));

        const successCount = tileImages.filter((t: any) => t.imageData).length;
        console.log(`[Nano Banana] Background: ${bgResult ? 'OK' : 'FAILED'}, Tiles: ${successCount}/${tiles.length}`);

        res.json({
            status: bgResult ? 'ok' : 'partial',
            images: {
                background: bgResult,
                tiles: tileImages
            }
        });

    } catch (error) {
        console.error('[Image API Error]', error);
        res.status(500).json({ error: 'Failed to generate images' });
    }
};

import { Request, Response } from 'express';
import { ai, MODELS } from '../services/gemini';

interface DecorationRequest {
    theme: string;
    tone: string;
    artStylePrompt: string;
    playerProfiles: Array<{
        displayName: string;
        tags: string[];
        lifestyle: string[];
    }>;
}

const buildDecorationPrompts = (req: DecorationRequest): string[] => {
    // Extract tags and interests from all player profiles
    const allTags = req.playerProfiles
        .flatMap(p => [...(p.tags || []), ...(p.lifestyle || [])])
        .filter(Boolean);

    const uniqueTags = [...new Set(allTags)].slice(0, 8);
    const tagHint = uniqueTags.length > 0
        ? `プレイヤーの興味: ${uniqueTags.join(', ')}`
        : '';

    const styleBase = `2.5D isometric game decoration sprite, flat illustration style, white/transparent background, cute and colorful, ${req.artStylePrompt || req.theme}`;

    return [
        `${styleBase}. A small cozy building or house inspired by: ${req.theme}. ${tagHint}. No text.`,
        `${styleBase}. A landmark or monument inspired by: ${req.theme}. ${tagHint}. No text.`,
        `${styleBase}. Nature element (tree, fountain, or garden) inspired by: ${req.theme}. ${tagHint}. No text.`,
        `${styleBase}. A vehicle or transport inspired by: ${req.theme}. ${tagHint}. No text.`,
    ];
};

const generateSingleDecoration = async (prompt: string, timeoutMs: number): Promise<string | null> => {
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
        console.error('[Decoration] Single image generation failed:', error);
        return null;
    }
};

export const generateDecorations = async (req: Request, res: Response) => {
    try {
        const body = req.body as DecorationRequest;

        if (!body.theme) {
            return res.status(400).json({ error: 'theme is required' });
        }

        console.log(`[Nano Banana] Generating decorations for theme: ${body.theme}`);

        const prompts = buildDecorationPrompts(body);

        // Generate all decorations in parallel with individual timeouts
        const results = await Promise.allSettled(
            prompts.map(prompt => generateSingleDecoration(prompt, 15000))
        );

        const decorations = results
            .map((r, idx) => ({
                id: idx,
                label: ['building', 'landmark', 'nature', 'vehicle'][idx],
                imageData: r.status === 'fulfilled' ? r.value : null,
            }));

        const successCount = decorations.filter(d => d.imageData).length;
        console.log(`[Nano Banana] Generated ${successCount}/${prompts.length} decorations`);

        res.json({
            status: successCount > 0 ? 'ok' : 'partial',
            decorations
        });

    } catch (error) {
        console.error('[Decoration API Error]', error);
        res.status(500).json({ error: 'Failed to generate decorations' });
    }
};

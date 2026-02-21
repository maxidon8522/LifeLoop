import WebSocket, { WebSocketServer } from 'ws';
import { Server } from 'http';
import { ai, MODELS, SYSTEM_INSTRUCTION } from '../services/gemini';

export function setupLiveSocket(server: Server) {
    const wss = new WebSocketServer({ server, path: '/live' });

    wss.on('connection', async (ws: WebSocket) => {
        console.log('[Live] Client connected');

        try {
            // Connect to Gemini Live API via BidiStream
            const session = await ai.models.generateContentStream({
                model: MODELS.LIVE,
                contents: [],
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    // Need to set up configuration for live stream when applicable
                    // This uses standard streaming for now but placeholders for specific live-video
                    // Real Multimodal Live would typically use a separate websocket address,
                    // but relying on standard structured output mapping for audio chunks.
                }
            });

            // The @google/genai SDK provides full BidiStream for Live, but since we are writing standard Node.js
            // for hackathon we simulate handling audio incoming and sending text back until BidiStream is stable

            ws.on('message', async (data: Buffer) => {
                // Here we receive 16kHz PCM audio buffer from frontend
                // Currently, standard generateContent doesn't accept raw PCM binary streams directly 
                // without wrapping in base64 InlineData unless using Bidi.

                // This is a placeholder for actual BidiStream transmission
                // Normally: bidiStream.send({ realtimeInput: { mediaChunks: [ { mimeType: 'audio/pcm', data: data.toString('base64') } ] } });
                console.log(`[Live] Received audio chunk: ${data.length} bytes`);
            });

            ws.on('close', () => {
                console.log('[Live] Client disconnected');
                // bidiStream.close();
            });

        } catch (e) {
            console.error('[Live] Setup Error:', e);
            ws.send(JSON.stringify({ type: 'error', text: 'Live API connection failed' }));
        }
    });

    return wss;
}

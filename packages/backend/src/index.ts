import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { generateProfile } from './controllers/profile';
import { setupLiveSocket } from './socket/live';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
setupLiveSocket(server);

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'LifeLoop BFF is running!' });
});

// Phase 1 Mock APIs
// [API Trigger 1] Profile Generation (Real Text API)
app.post('/api/generate/profile', generateProfile);

// [API Trigger 2] Board Generation Mock
app.post('/api/generate/board', (req, res) => {
    const { players, sessionMinutes } = req.body;
    console.log(`[Mock] Generating board for ${players?.length || 0} players (${sessionMinutes || 10} min)...`);

    // Return mock response after a 2-second delay to simulate slow generation
    setTimeout(() => {
        res.json({
            world: {
                theme: "深夜のハッカソン会場",
                tone: "コミカル"
            },
            tiles: [
                {
                    id: 1,
                    title: "バグ発生",
                    type: "event",
                    effect: { type: "retreat", value: 1 },
                    eventText: "謎のエラーで作業が1ターン遅れた！"
                },
                {
                    id: 2,
                    title: "エナジードリンク",
                    type: "event",
                    effect: { type: "advance", value: 2 },
                    eventText: "カフェイン摂取で一気に2マス進む！"
                },
                {
                    id: 3,
                    title: "デモ開始",
                    type: "goal",
                    effect: { type: "none", value: 0 },
                    eventText: "なんとかデモに間に合った！ゴール！"
                }
            ]
        });
    }, 2000);
});

// Start server
server.listen(PORT, () => {
    console.log(`Server (HTTP + WS) is running on http://localhost:${PORT}`);
});

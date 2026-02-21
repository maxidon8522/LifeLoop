import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { generateProfile } from './controllers/profile';
import { generateBoard } from './controllers/board';
import { generateImages } from './controllers/images';
import { triggerRebalance } from './controllers/director';
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

// [API Trigger 2] Board Generation (Real Text API)
app.post('/api/generate/board', generateBoard);

// [API Trigger 3] Image Generation (Nano Banana)
app.post('/api/generate/images', generateImages);

// [API Trigger 4] AI Director (Demo Guarantee Rebalance)
app.post('/api/director/rebalance', triggerRebalance);

// Start server
server.listen(PORT, () => {
    console.log(`Server (HTTP + WS) is running on http://localhost:${PORT}`);
});

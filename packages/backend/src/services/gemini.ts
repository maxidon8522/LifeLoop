import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Default project setup
const apiKey = process.env.GEMINI_API_KEY;

export const ai = new GoogleGenAI({ apiKey });

export const MODELS = {
    LIVE: 'gemini-3.0-flash-preview',
    TEXT: 'gemini-3.0-flash-preview', // or gemini-2.5-flash
    IMAGE: 'gemini-3.0-pro-image-preview'
};

export const SYSTEM_INSTRUCTION = "性格タイプ判定をしない / 医療・メンタル助言をしない / 個人の機微情報を推測しない";

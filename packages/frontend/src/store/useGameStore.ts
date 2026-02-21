import { create } from 'zustand';

export interface PlayerProfile {
    displayName: string;
    tags: string[];
    lifestyle: string[];
    attributes: string[];
    position: number;
    score: number;
}

export interface BoardTile {
    id: number;
    title: string;
    type: "normal" | "bonus" | "penalty" | "event" | "rescue" | "goal";
    eventSeed: string;
    effect: {
        type: "advance" | "retreat" | "score" | "swap" | "choice" | "none";
        value: number;
    };
    iconPrompt: string;
}

export interface BoardSpec {
    world: {
        theme: string;
        tone: string;
        artStylePrompt: string;
    };
    tiles: BoardTile[];
}

export interface GameStore {
    rawTranscripts: Record<number, string>;
    players: PlayerProfile[];
    board: BoardSpec | null;
    currentTurn: number;
    activePlayerIndex: number;
    decorationImages: string[];
    backgroundImage: string | null;
    tileImages: Record<string, string>;

    addRawTranscript: (index: number, text: string) => void;
    setPlayerProfile: (index: number, profile: Omit<PlayerProfile, 'position' | 'score'>) => void;
    setBoard: (board: BoardSpec) => void;
    fallbackToTemplate: (fallbackData: BoardSpec) => void;
    movePlayer: (index: number, steps: number) => void;
    addScore: (index: number, points: number) => void;
    nextTurn: () => void;
    resetGame: () => void;
    setDecorationImages: (images: string[]) => void;
    setBackgroundImage: (image: string) => void;
    setTileImages: (images: Record<string, string>) => void;
}

export const useGameStore = create<GameStore>()((set) => ({
    rawTranscripts: {},
    players: [],
    board: null,
    currentTurn: 1,
    activePlayerIndex: 0,
    decorationImages: [],
    backgroundImage: null,
    tileImages: {},

    addRawTranscript: (index, text) => set((state) => ({
        rawTranscripts: { ...state.rawTranscripts, [index]: text }
    })),

    setPlayerProfile: (index, profile) => set((state) => {
        const newPlayers = [...state.players];
        newPlayers[index] = { ...profile, position: 0, score: 0 };
        return { players: newPlayers };
    }),

    setBoard: (board) => set({ board }),

    fallbackToTemplate: (fallbackData) => set({ board: fallbackData }),

    movePlayer: (index, steps) => set((state) => {
        const newPlayers = [...state.players];
        const targetPlayer = newPlayers[index];
        if (!targetPlayer) {
            return state;
        }
        const maxPos = (state.board?.tiles?.length || 1) - 1;
        newPlayers[index] = {
            ...targetPlayer,
            position: Math.min(Math.max(targetPlayer.position + steps, 0), maxPos)
        };
        return { players: newPlayers };
    }),

    nextTurn: () => set((state) => {
        const nextIdx = state.activePlayerIndex + 1;
        if (nextIdx >= state.players.length) {
            return { activePlayerIndex: 0, currentTurn: state.currentTurn + 1 };
        }
        return { activePlayerIndex: nextIdx };
    }),

    addScore: (index, points) => set((state) => {
        const newPlayers = [...state.players];
        const player = newPlayers[index];
        if (player) {
            newPlayers[index] = { ...player, score: (player.score || 0) + points };
        }
        return { players: newPlayers };
    }),

    setDecorationImages: (images) => set({ decorationImages: images }),
    setBackgroundImage: (image) => set({ backgroundImage: image }),
    setTileImages: (images) => set({ tileImages: images }),

    resetGame: () => set({
        rawTranscripts: {}, players: [], board: null, currentTurn: 1, activePlayerIndex: 0,
        decorationImages: [], backgroundImage: null, tileImages: {}
    })
}));

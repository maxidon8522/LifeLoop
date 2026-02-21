import { create } from 'zustand';

export interface PlayerProfile {
    displayName: string;
    tags: string[];
    lifestyle: string[];
    attributes: string[];
    position: number;
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

    addRawTranscript: (index: number, text: string) => void;
    setPlayerProfile: (index: number, profile: Omit<PlayerProfile, 'position'>) => void;
    setBoard: (board: BoardSpec) => void;
    fallbackToTemplate: (fallbackData: BoardSpec) => void;
    movePlayer: (index: number, steps: number) => void;
    nextTurn: () => void;
    resetGame: () => void;
}

export const useGameStore = create<GameStore>()((set) => ({
    rawTranscripts: {},
    players: [],
    board: null,
    currentTurn: 1,
    activePlayerIndex: 0,

    addRawTranscript: (index, text) => set((state) => ({
        rawTranscripts: { ...state.rawTranscripts, [index]: text }
    })),

    setPlayerProfile: (index, profile) => set((state) => {
        const newPlayers = [...state.players];
        newPlayers[index] = { ...profile, position: 0 };
        return { players: newPlayers };
    }),

    setBoard: (board) => set({ board }),

    fallbackToTemplate: (fallbackData) => set({ board: fallbackData }),

    movePlayer: (index, steps) => set((state) => {
        const newPlayers = [...state.players];
        const maxPos = (state.board?.tiles?.length || 1) - 1;
        newPlayers[index] = {
            ...newPlayers[index],
            position: Math.min(Math.max(newPlayers[index].position + steps, 0), maxPos)
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

    resetGame: () => set({
        rawTranscripts: {}, players: [], board: null, currentTurn: 1, activePlayerIndex: 0
    })
}));

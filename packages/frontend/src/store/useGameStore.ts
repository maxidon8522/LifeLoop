import { create } from 'zustand';

export interface PlayerProfile {
    displayName: string;
    tags: string[];
    lifestyle: string[];
    attributes: string[];
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

    addRawTranscript: (index: number, text: string) => void;
    setPlayerProfile: (index: number, profile: PlayerProfile) => void;
    setBoard: (board: BoardSpec) => void;
    fallbackToTemplate: (fallbackData: BoardSpec) => void;
    resetGame: () => void;
}

export const useGameStore = create<GameStore>()((set) => ({
    rawTranscripts: {},
    players: [],
    board: null,

    addRawTranscript: (index, text) => set((state) => ({
        rawTranscripts: { ...state.rawTranscripts, [index]: text }
    })),

    setPlayerProfile: (index, profile) => set((state) => {
        const newPlayers = [...state.players];
        newPlayers[index] = profile;
        return { players: newPlayers };
    }),

    setBoard: (board) => set({ board }),

    fallbackToTemplate: (fallbackData) => set({ board: fallbackData }),

    resetGame: () => set({ rawTranscripts: {}, players: [], board: null })
}));

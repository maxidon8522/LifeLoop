import { create } from 'zustand';

export type ScreenPhase =
    | "TITLE"           // 00: タイトル
    | "PREPARE"         // 01: プレイヤー準備
    | "LISTENING"       // 02: Listening (マイク録音中)
    | "NEXT_PROMPT"     // 03: 次のプレイヤー判定
    | "GENERATING"      // 04: バックエンドAPI待機中 (Loading)
    | "READY"           // 05: 生成完了
    | "PLAYING";        // すごろくプレイ

export type AppLanguage = "ja" | "en";

interface FlowStore {
    currentScreen: ScreenPhase;
    currentPlayerIndex: number;
    isLoading: boolean;
    language: AppLanguage;
    setScreen: (screen: ScreenPhase) => void;
    nextPlayer: () => void;
    resetFlow: () => void;
    setLoading: (loading: boolean) => void;
    setLanguage: (language: AppLanguage) => void;
}

export const useFlowStore = create<FlowStore>()((set) => ({
    currentScreen: "TITLE",
    currentPlayerIndex: 0,
    isLoading: false,
    language: "ja",

    setScreen: (screen) => set({ currentScreen: screen }),
    nextPlayer: () => set((state) => ({
        currentPlayerIndex: state.currentPlayerIndex + 1,
        currentScreen: "LISTENING"
    })),
    resetFlow: () => set({ currentScreen: "TITLE", currentPlayerIndex: 0, isLoading: false }),
    setLoading: (loading) => set({ isLoading: loading }),
    setLanguage: (language) => set({ language })
}));

import type { BoardSpec } from '../store/useGameStore';

export const fallbackBoard: BoardSpec = {
    world: {
        theme: "ハッカソン緊急リカバリー作戦",
        tone: "ドタバタ",
        artStylePrompt: "Colorful hackathon command center with sticky notes, laptops, and cheerful chaos"
    },
    tiles: [
        {
            id: 1,
            title: "朝礼スタート",
            type: "normal",
            eventSeed: "今日の目標を宣言して士気アップ",
            effect: { type: "none", value: 0 },
            iconPrompt: "Morning standup with team around whiteboard"
        },
        {
            id: 2,
            title: "環境構築",
            type: "event",
            eventSeed: "依存関係の地雷を回避できた",
            effect: { type: "advance", value: 1 },
            iconPrompt: "Terminal setup check marks and package icons"
        },
        {
            id: 3,
            title: "仕様迷子",
            type: "penalty",
            eventSeed: "要件を読み直して1マス戻る",
            effect: { type: "retreat", value: 1 },
            iconPrompt: "Confused roadmap and sticky notes"
        },
        {
            id: 4,
            title: "神レビュー",
            type: "bonus",
            eventSeed: "レビューで改善点が一気に見えた",
            effect: { type: "advance", value: 2 },
            iconPrompt: "Code review with green check marks"
        },
        {
            id: 5,
            title: "集中ゾーン",
            type: "normal",
            eventSeed: "無音タイムで実装が進む",
            effect: { type: "none", value: 0 },
            iconPrompt: "Focused coder with headphones"
        },
        {
            id: 6,
            title: "ビルド失敗",
            type: "penalty",
            eventSeed: "型エラー祭りで足止め",
            effect: { type: "retreat", value: 2 },
            iconPrompt: "Red CI failed badge and broken build"
        },
        {
            id: 7,
            title: "助っ人参上",
            type: "rescue",
            eventSeed: "チームメイトの助言で復活",
            effect: { type: "advance", value: 2 },
            iconPrompt: "Teammate helping fix bug"
        },
        {
            id: 8,
            title: "デモ練習",
            type: "event",
            eventSeed: "発表台本がまとまり自信がついた",
            effect: { type: "advance", value: 1 },
            iconPrompt: "Pitch practice with timer and slides"
        },
        {
            id: 9,
            title: "最終調整",
            type: "normal",
            eventSeed: "UIの見た目を整えて完成度アップ",
            effect: { type: "none", value: 0 },
            iconPrompt: "UI polishing with color palette"
        },
        {
            id: 10,
            title: "ピッチ本番",
            type: "goal",
            eventSeed: "審査員へ最高のデモを披露",
            effect: { type: "none", value: 0 },
            iconPrompt: "Hackathon stage spotlight and applause"
        }
    ]
};

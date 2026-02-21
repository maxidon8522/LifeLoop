# LifeLoop — 技術要件定義書（TRD）

> **プロジェクト名**: LifeLoop  
> **開発フェーズ**: ハッカソン開発用 (2026-02-21)  

この文書は、[LifeLoop PRD (requirements.md)](requirements.md) に基づき、ハッカソン期間中の限られた時間内で迷いなく実装・分担を進めるための**アーキテクチャ・設計・インターフェースの合意事項**を定義するものです。

---

## 1. システムアーキテクチャとリポジトリ構成

### 1.1 全体アーキテクチャ

*   **Frontend**: React (Vite) + TypeScript + PixiJS
*   **Backend (BFF)**: Node.js + Express
*   **AI Services**: Gemini Live API, Gemini Text API, Nano Banana

**設計方針制限（APIキー保護）**:
Gemini APIやNano Bananaへのアクセスに必要な`API_KEY`は、**必ずBFF層（Node.js サーバ）の環境変数 (`.env`) 内でのみ保持**します。ブラウザのクライアントコード（Frontend）には一切埋め込まず、Web通信の全リクエストはBFFを経由させます。

### 1.2 ディレクトリ構成（Monorepo方針）

```text
lifeloop/
├── packages/
│   ├── frontend/         # React SPA
│   │   ├── src/
│   │   │   ├── components/  # Reactコンポーネント (UI)
│   │   │   ├── game/        # PixiJS Canvas ロジック
│   │   │   ├── store/       # Zustand ステート管理
│   │   │   └── api/         # BFF通信用クライアント
│   │   └── package.json
│   │
│   └── backend/          # Node.js BFF サーバ
│       ├── src/
│       │   ├── routes/      # REST HTTPエンドポイント (Gemini Text, Nano Banana)
│       │   ├── socket/      # WebSocketハンドラ (Gemini Liveプロキシ)
│       │   └── services/    # Google API クライアントロジック
│       └── package.json
│
├── package.json          # ワークスペース定義
└── docker-compose.yml    # ローカル開発用
```

---

## 2. 状態管理 (State Management)

フロントエンドはZustandを主軸とし、ライフサイクルとデータ永続化を分担します。

### 2.1 ゲームフェーズ状態 (`useGamePhaseStore`)

ゲーム全体の進行状況を厳格に管理します。

```typescript
type GamePhase = 
  | "INIT"          // タイトル・設定画面 
  | "LIVE_INPUT"    // 音声自己紹介入力中 
  | "BOARD_GEN"     // 盤面生成中 (Loading)
  | "PLAYING"       // すごろくプレイ中
  | "RESULT";       // 終了・リザルト画面

interface GamePhaseStore {
  currentPhase: GamePhase;
  setPhase: (phase: GamePhase) => void;
}
```

### 2.2 プレイ状態 (`useGameStore`)

PRDに定義された `GameState` に従い、盤面のマス、プレイヤーの位置とスコア等を管理します。

*   **永続化対象外**: リロード時は状態が消えてもデモへの影響最小とみなすが、オフライン時の一時保存として `sessionStorage` へのバックアップ書き込みは推奨。

### 2.3 メタ進行・フォールバックDB (`useMetaStore`)

*   **永続化対象 (`localStorage`)**:
    *   `MetaProgress` (スタンプ、実績、Perk XP)
    *   `FallbackEvents` (ネット断線・API障害時に備えた最低20件のローカルイベントプール)

---

## 3. BFF API仕様スタブ

フロントエンドからBFFへのアクセス群です。CORS設定を必ず有効にしてください。

### 3.1 REST API (Gemini Text & Nano Banana)

#### `POST /api/generate/board`
*   **用途**: Gemini Text API (`gemini-3-flash`) を呼び出し、構造化された `BoardSpec` JSONを生成する。
*   **制約**: `response_mime_type="application/json"` と `response_schema` を必ずSDK内で指定すること。
*   **タイムアウト監視**: BFF側で処理時間が **2.5秒** を超過した場合はエラーを返し、フロントは即座にテンプレ盤面へフォールバックさせる。

#### `POST /api/generate/images`
*   **用途**: Nano Banana (`gemini-3-pro-image-preview`) を呼び出し、背景画像とアイコンを生成する。
*   **非同期方針**: 盤面構築（上記Board）がフロントに返却された後、**バックグラウンド（非同期）** でこのAPIを叩き、返ってきたURL順にReact（PixiJS）のテクスチャを差し替える（Lazy load）。N秒タイムアウト時はデフォルトアセットのパスを返す。

### 3.2 WebSocket通信 (Gemini Live Proxy)

#### `ws://[HOST]/live`
*   フロントの `MediaRecorder` 等で取得したオーディオチャンク（**16-bit PCM / 16kHz / mono** にダウンサンプリング必須）をこのWebSocketに流し込み、BFFがGemini Live APIへとプロキシする。
*   **BFF -> Front への送信メッセージ**:
    *   `{ type: "transcription", text: "..." }`: 音声認識の途中経過。
    *   `{ type: "modelTag", tag: "アニメ" }`: モデルからの抽出結果（キーワード）。
*   **順序保証対策**: フロントのStoreは、受信したメッセージをバッファ配列にプッシュするだけで表示更新を行い、整合性チェックは行わない（順序がバラバラでもUI上「リアルタイムで処理している事」が伝わればOK）。

---

## 4. AI連携と構造化データ実装の重要方針

### 4.1 Live API と Text API の役割分割（厳守）

PRDで決定した通り、Live APIのWebSocketは `generationConfig.responseSchema` が使えません。

1.  **AI可視化（演出）**: Gemini Live APIを使用。途中経過のタグ候補や文字起こしをUIにストリーミング表示するだけ。JSONを期待しない。
2.  **確定データのパース（処理）**: 上記Live APIで得られた「トランススクリプトの全テキスト＋断片タグ群」をまとめ、`POST /api/generate/profile` などのText APIに投げ入れ、**Text API側でガチガチのJSON (PlayerProfile等) を出力させる**。

### 4.2 AI Directorの発火実装（Turn単位クロック）

**デモ確約トリガー** の実装方針です。

フロントエンドのターン進行ロジック内で、以下のチェックフックを設けます。

```typescript
function endTurn() {
  state.turn++;
  
  // NFRデモ確約: 10分セッション ＆ Turn=1終了時は絶対にAI Directorを呼ぶ
  if (config.sessionMinutes === 10 && state.turn === 1) {
    triggerAiDirector(forceRescue = true);
  } else {
    // 通常の格差検知ロジック
    const dist = calculateDistance();
    if (dist >= THRESHOLD) triggerAiDirector();
  }
}
```

---

## 5. フォールバック・安定性実装メカニズム

審査の3分デモで「止まらない」ためのセーフティネット実装要件です。フロントエンド内で必ず以下の `try-catch` / タイマー処理をラップしてください。

### 5.1 ネットワーク/Live API 障害時
*   **監視条件**: 
    1. WebSocketの接続エラー (`onerror` / `onclose` 時の再接続失敗)
    2. 音声入力中の**5秒無音**検知 (Silence Detection)
    3. 音声送信から**3秒間推論結果が返らない**場合
*   **発火アクション**: 即座に「テキスト入力モード」コンポーネントへ画面を切り替え、Live通信をAbortする。

### 5.2 盤面生成API (`/api/generate/board`) タイムアウト時
```typescript
// 呼び出し例イメージ
const fallbackBoard = getLocalTemplateBoard(); // 8〜12マス固定のハードコードJSON

try {
  // AbortController を使って 2.5s でタイムアウトさせる
  const board = await fetchWithTimeout('/api/generate/board', 2500); 
  setBoard(board);
} catch (e) {
  console.warn("Board Gen Timeout! Falling back.");
  setBoard(fallbackBoard);
}
```

### 5.3 画像生成 (`Nano Banana`) 遅延・失敗時
*   フロントのStoreのImageStateは初期状態で `url: "/assets/default.png", loading: true` にしておく。
*   Nano BananaのFetchが成功した場合のみ `url` を上書き。失敗・タイムアウトした場合はそのままのデフォルトアイコンとして扱う（ユーザのプレイ進行をプログレスバー等でブロック**してはいけない**）。

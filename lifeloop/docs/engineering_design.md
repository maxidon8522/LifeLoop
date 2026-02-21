# LifeLoop — 詳細基本設計書 (Engineering Design Document)

> **プロジェクト名**: LifeLoop  
> **ドキュメント**: 詳細基本設計書  
> **対象読者**: フロントエンドエンジニア、バックエンドエンジニア

これまでに定義された PRD・TRD・UI/UX仕様 に基づき、エンジニアが直ちにコーディングを開始できるよう、状態管理・APIインターフェース・画面コンポーネント構成を定義した設計書です。

---

## 1. モジュールとディレクトリ構造 (Monorepo)

ハッカソン特化の軽量な構成とします。

```text
lifeloop/
├── packages/
│   ├── frontend/         # Vite + React (TypeScript)
│   │   ├── public/       # デフォルトアセットなど
│   │   ├── src/
│   │   │   ├── components/  # Reactコンポーネント
│   │   │   │   ├── screens/ # 00〜05 の画面単位コンポーネント
│   │   │   │   ├── ui/      # 汎用ボタン、ローダー等
│   │   │   │   └── game/    # PixiJS Canvasをマウントするコンテナ
│   │   │   ├── store/       # Zustand
│   │   │   │   ├── useGameStore.ts      # ゲームロジック用
│   │   │   │   └── useFlowStore.ts      # 画面遷移・進行状態用
│   │   │   ├── lib/         # APIクライアント、WebSocketヘルパー
│   │   │   └── App.tsx      # ルーティング基盤
│   │   └── package.json
│   │
│   └── backend/          # Express (TypeScript)
│       ├── src/
│       │   ├── controllers/ # Generate処理 (Board, Profile)
│       │   ├── socket/      # Gemini Live API proxy
│       │   ├── services/    # Google GenAI SDK ラッパー
│       │   └── index.ts     # サーバー起動 (HTTP + WS)
│       ├── .env             # 隠蔽すべき環境変数 (API_KEY)
│       └── package.json
```

---

## 2. フロントエンド状態管理設計 (Zustand)

画面間のデータ受け渡しやプロセスのロックを防ぐためのStore設計です。

### 2.1 `useFlowStore` (画面遷移・進行管理用)

[UI/UX仕様書](./ui_ux_specification.md)の画面(00〜05)をマッピングします。

```typescript
type ScreenPhase = 
  | "TITLE"           // 00: タイトル
  | "PREPARE"         // 01: プレイヤー準備
  | "LISTENING"       // 02: Listening (マイク録音中)
  | "NEXT_PROMPT"     // 03: 次のプレイヤー判定
  | "GENERATING"      // 04: バックエンドAPI待機中 (Loading)
  | "READY"           // 05: 生成完了
  | "PLAYING";        // すごろくプレイ

interface FlowStore {
  currentScreen: ScreenPhase;
  currentPlayerIndex: number;  // 現在何人目の録音をしているか
  isLoading: boolean;
  setScreen: (screen: ScreenPhase) => void;
  nextPlayer: () => void;
}
```

### 2.2 `useGameStore` (ゲームデータ・プレイヤー管理用)

生成されたプレイヤー情報と盤面を保持します。

```typescript
import { PlayerProfile, BoardSpec } from './types';

interface GameStore {
  // Inputされた会話のローデータを保持（Profile生成に使うため）
  rawTranscripts: Record<number, string>; // { [playerIndex]: "私のアニメが..." }
  
  // APIから確定されたデータ
  players: PlayerProfile[];
  board: BoardSpec | null;

  // Actions
  addRawTranscript: (index: number, text: string) => void;
  setPlayerProfile: (index: number, profile: PlayerProfile) => void;
  setBoard: (board: BoardSpec) => void;
  
  // Failsafe用
  fallbackToTemplate: () => void;
}
```

---

## 3. BFF API エンドポイント通信定義

フロントエンドとBFF（バックエンド）間の通信IFです。データの構造化 (`responseSchema`) を行う Text API 用のエンドポイント。

### 3.1 プロフィール生成: `POST /api/generate/profile`
*   **用途**: 画面02「Stop」押下時 **【APIトリガー 1】** に非同期で発火。
*   **Request Body**:
    ```json
    {
      "playerIndex": 0,
      "transcript": "こんにちは。私はエンジニアで、休日はよくピザを食べながらアニメを見ています。"
    }
    ```
*   **Response Body**: (200 OK)
    ```json
    {
      "playerIndex": 0,
      "profile": {
        "displayName": "Player 1",
        "tags": ["エンジニア", "ピザ", "アニメ"],
        "lifestyle": ["インドア"],
        "attributes": ["テック"]
      }
    }
    ```

### 3.2 盤面生成: `POST /api/generate/board`
*   **用途**: 画面03「完了してゲームを開始」押下時 **【APIトリガー 2】** に発火。
*   **制約**: バックエンド内で必ず **2.5秒タイムアウト** を実装し、間に合わない場合は 206 Partial Content 等でFallback Boardを返すか、エラーをThrowしてフロントにFallbackさせること。
*   **Request Body**:
    ```json
    {
      "players": [ { /* PlayerProfileの配列 */ } ],
      "sessionMinutes": 10
    }
    ```
*   **Response Body**: (200 OK) ※ `BoardSpec` の実体
    ```json
    {
      "world": {
        "theme": "深夜のジャンクフード冒険",
        "tone": "コミカル"
      },
      "tiles": [
        {
          "id": 1,
          "title": "ピザの誘惑",
          "type": "event",
          "effect": { "type": "advance", "value": 2 },
          "eventText": "美味しそうな匂いにつられて2マス進む"
        }
      ]
    }
    ```

### 3.3 非同期画像生成: `POST /api/generate/images`
*   **用途**: 画面05到達時（BoardSpec受信後）にフロントから発火させる。
*   **非同期設計**: レスポンスを待たずにUIのレンダリングを開始し、返却されたらZustand経由でテクスチャURLを差替える。

---

## 4. Gemini Live API 連携（WebSocket Proxy）の設計

画面02（Listening）中のリアルタイム演出用です。

### 通信フロー

1.  **接続**: `ws://localhost:3000/live` にフロントエンドから接続。
2.  **音声送信 (Front -> BFF)**: `MediaRecorder` からの Blob チャンクを `Int16Array (16kHz PCM)` に変換し、バイナリでBFFにSendする。
3.  **転送 (BFF -> Gemini)**: BFFは受け取った PCM データを `base64` エンコードし、Google Gemini SDK (Live Stream) に流し込む。
4.  **結果受信 (Gemini -> BFF -> Front)**: モデルからの応答（テキストやTranscription）をBFFがパースし、JSON文字列としてフロントにWebSocket経由で送り返す。

### メッセージフォーマット (BFF -> Front)

```json
// 文字起こし（途中経過）
{
  "type": "transcription",
  "text": "休日はよく..."
}

// モデルからの合いの手・抽出キーワード等（サーバコンテンツ）
{
  "type": "serverContent",
  "text": "アニメが好きなんですね！" 
}
```
**フロントエンド実装側への注意**: 画面02のUIには、これらをそのまま配列ストリームとして `<li>` などで画面にリアルタイムに描画するだけでよいです。

---

## 5. UIコンポーネント構成（React）

[UI/UX仕様書](./ui_ux_specification.md)の画面番号に合わせたコンポーネントの作成指示です。
`src/components/screens/` 配下に作成します。

1.  `Screen00Title.tsx`
    *   状態遷移を `PREPARE` へ変更するボタンのみ。
2.  `Screen01Prepare.tsx`
    *   マイク権限の取得（`navigator.mediaDevices.getUserMedia`）。取得成功で `LISTENING` へ。
3.  `Screen02Listening.tsx`
    *   `useWebSocket()` カスタムフック等でBFFと通信。
    *   `Stop` 押下時、BFFの `/api/generate/profile` を叩く `fetch` を非同期で走らせ（`Promise`を変数に保持）、画面状態を `NEXT_PROMPT` へ移行。
4.  `Screen03NextPrompt.tsx`
    *   「はい」-> `LISTENING` へ。
    *   「完了して開始」-> 画面02で走らせた全プレイヤーのプロフィールの `Promise.all` 完了を待ってから、`/api/generate/board` へリクエストを投げ、画面を `GENERATING` へ移行。
5.  `Screen04Generating.tsx`
    *   Board APIの待機画面。結果を受信（またはCatchにてFallback適用）したら状態を `READY` へ。
6.  `Screen05Ready.tsx`
    *   生成されたタイトルを表示。「ゲーム開始」で Canvas マウント（PixiJS 側へ制御を渡す）。

---

## 6. フェイルセーフ実装

デモ中にアプリが完全に停止（フリーズ）しないための最低要件です。

1.  **タイムアウト関数のラップ**:
    フロントエンド側でも Fetch リクエストに `AbortController` を使い、設定秒数（例: 2.5秒）で強制失敗させるUtilityを全APIコールに噛ませてください。
2.  **フォールバックデータの定数化**:
    ネットワーク断線テスト用に、`src/lib/fallbackBoard.json` を静的ファイルとして持ち、Fetch失敗の `catch` ブロック内でこの定数を `setBoard` に突っ込む設計とします。

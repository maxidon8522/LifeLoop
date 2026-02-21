# LifeLoop — 開発ロードマップ (Development Roadmap)

> **プロジェクト名**: LifeLoop  
> **開発体制**: チーム並行開発 (Frontend: React/PixiJS, Backend: Node.js)

本ドキュメントは、作成した PRD・UI/UX仕様・基本設計書 をチームメンバーが分担してハッカソン期間内で作り上げるための**ステップ・バイ・ステップの開発タスク一覧**です。

---

## 🏆 Phase 0: プロジェクト初期化と環境構築 (キックオフ)

リポジトリ作成直後に**全員で確認・実施**するステップです。

- [ ] GitHub リポジトリ (`lifeloop`) の作成と `.gitignore` の設定
- [ ] 直下に `docs/` を切り、本仕様書群（PRD, TRD等）を Push
- [ ] モノレポ構造の土台作成:
  - `packages/frontend/` (Vite + React-TS 雛形生成)
  - `packages/backend/` (Express + TS 雛形生成)
- [ ] パッケージマネージャ (npm workspace / pnpm 等) のセットアップ

---

## 🚀 Phase 1: モック通信とUIガワの作成 (並行作業)

Frontend と Backend で作業を分け、まずはお互いの**ダミー（モック）インターフェースを結合**して画面遷移 00〜05 が完走できるようにします。

### Frontend チームのタスク (Phase 1)
- [ ] **Storeの定義**: Zustand (`useFlowStore`, `useGameStore`) のスケルトンを作る。
- [ ] **画面00〜01**: タイトルと準備画面の静的UI構築。
- [ ] **画面02**: Listening画面の「Stop」ボタンとダミー可視化UI。
  - *この時点ではマイク録音はせず、ボタン押下でダミーのProfile生テキストをStoreに保存する。*
- [ ] **画面03〜05**: 次のプレイヤー確認からLoading、結果表示までのルーティング。
- [ ] **BFF通信スタブ**: 画面02のStop時と、画面03の完了時に `/api/generate/*` へ Fetchする関数（現状は1秒待ってモックJSONを返すだけ）を繋ぎ込む。

### Backend チームのタスク (Phase 1)
- [ ] **Expressサーバ基盤**: 起動スクリプト、CORS設定、ボディパーサーの実装。
- [ ] **`.env` 管理**: `GEMINI_API_KEY` を読み込む仕組みの構築（`.env` はコミットさせない）。
- [ ] **REST APIモック**: 
  - `POST /api/generate/profile` -> 固定のPlayerProfile JSON を返す。
  - `POST /api/generate/board` -> 固定のBoardSpec JSON を返す。（2.5秒等のタイマー検証用に、意図的に待たせるオプションを付けるのもあり）。
- [ ] Frontend からモックAPIが問題なく叩けるかの疎通確認。

---

## 🧠 Phase 2: Live API連携とプロトタイプ結合

AIを実際に組み込み、自己紹介がデータとして抽出される根幹を作ります。

### Frontend チームのタスク (Phase 2)
- [ ] **マイク音声取得**: 画面01〜02で `navigator.mediaDevices.getUserMedia` を呼び出し、録音開始。
- [ ] **PCMエンコード**: 取得した音声を 16-bit / 16kHz / mono へダウンサンプリングしてバイナリ化するユーティリティの実装。
- [ ] **WebSockets通信**: 画面02で録音中、音声をBFFのWebsocket (`/live`) へストリーミング送信する。
- [ ] **Live受信**: WebSocketから返ってくる `transcription` (文字起こし) を画面02のUIに表示。

### Backend チームのタスク (Phase 2)
- [ ] **WSサーバ基盤**: `ws` または `socket.io` パッケージを利用したWebSocketエンドポイント構築。
- [ ] **Gemini Live API 連携**: フロントから受け取ったオーディオバイナリをBase64変換し、Google GenAI SDK (Multimodal Live) へ中継（Proxy）する。
- [ ] **Gemini Text API 連携**: 
  - `POST /api/generate/profile` 内で、生テキストを Gemini 3 Flash に投げ、**PlayerProfile JSON** を返す実装（`responseSchema` 使用）。

---

## 🎲 Phase 3: ボード生成と非同期処理（最難関）

フロント側は描画を、バックエンド側は重いデータ生成とタイムアウト制御を担います。

### Frontend チームのタスク (Phase 3)
- [ ] **フェイルセーフ実装**: 全API Fetchに `AbortController` を追加。BoardAPIが2.5秒で返らなければ、ローカルの `fallbackBoard.json` を読み込む。
- [ ] **PixiJS 統合**: 画面05到達後、Canvasをマウント。
- [ ] **盤面・コマ描画**: BoardSpecのJSONに基づき、2.5D（またはTop-down）のマスを配置。
- [ ] **非同期画像差替**: 画面05表示と同時に `/api/generate/images` をFetchし、URLが返却され次第 PixiJS 内のテクスチャ（スプライト）を切り替える。

### Backend チームのタスク (Phase 3)
- [ ] **Board生成基盤**:
  - `POST /api/generate/board` で、受け取ったProfile配列を元に `BoardSpec` を生成（`responseSchema`）。
  - API内タイマー監視（2.5秒を超過したら、バックエンド側で処理をAbortするか、フォールバックのJSONを返す）。
- [ ] **Nano Banana 画像生成**:
  - `POST /api/generate/images` エンドポイント作成。
  - プロンプトを構築して画像生成API (`gemini-3-pro-image-preview`) を呼び出し、結果のURL（またはBase64）を配列にしてフロントへ返す。

---

## 🎮 Phase 4: AI Directorとプレイロジックの完成

デモに向けた調整とブラッシュアップフェーズです。

### Frontend チームのタスク (Phase 4)
- [ ] **サイコロ・移動ロジック**: プレイヤーがサイコロを振り、指定マスへアニメーション移動する処理。
- [ ] **イベント表示**: マス到達時に、BoardSpecに書かれた `eventText` のポップアップ表示。
- [ ] **DQ回避表示**: "Built at Hackathon" と関連するクレジットパネルをタイトルや設定画面から遷移できるようにする。

### Backend チームのタスク (Phase 4)
- [ ] **AI Director連携 (Text API)**: 
  - ターン終了時などに呼ばれる `POST /api/director/rebalance` 等のエンドポイント作成。
  - P0要件（デモ確約トリガー）として、10分セッションかつ Turn=1 の時は、必ず「Rebalance（救済マス追加）」のJSONを返すように制御を仕込む。
- [ ] **ログ・プライバシー制御**: BFFサーバにて、音声データなどをメモリ以外（ファイル等）に書き出さないよう最終監査。

---

## 🏁 Phase 5: デモ・通しリハーサル (Final)

- [ ] **通しプレイ検証**: 音声入力〜盤面生成〜1ターンプレイ（AI Director発動まで）が一度もフリーズせずに進行するか。
- [ ] **通信断線テスト**: 意図的にWifiを切り、フォールバックデータで進行できるか。
- [ ] **タイムアウトテスト**: Board生成APIでわざと `setTimeout` 3秒を入れ、テンプレ盤面に切り替わるかをテスト。
- [ ] **3分台本の最適化**: デモ本番用のトークに合わせてUI速度やアニメーション時間を調整。

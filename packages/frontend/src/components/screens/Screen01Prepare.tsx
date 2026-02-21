import { useFlowStore } from '../../store/useFlowStore';
import { PreGameFrame } from './PreGameFrame';

export const Screen01Prepare = () => {
    const { setScreen, currentPlayerIndex } = useFlowStore();

    const handleStartRecording = async () => {
        try {
            // Phase 1: Mock microphone permission
            // In Phase 2: await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("Mock: Mic permission granted");
            setScreen("LISTENING");
        } catch {
            alert("マイクへのアクセスを許可してください");
        }
    };

    return (
        <PreGameFrame
            badge="PREPARE"
            title={`Player ${currentPlayerIndex + 1} の自己紹介`}
            description={(
                <>
                    「名前・趣味・最近ハマっていること」などを自由にマイクへ話してください。<br />
                    LifeLoop AIが特徴を抽出し、盤面のイベントに反映します。
                </>
            )}
        >
            <button
                onClick={handleStartRecording}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#4A3728]/15 bg-gradient-to-r from-[#FF6B35] to-[#FF8A57] px-10 py-4 text-2xl font-black text-white shadow-[0_8px_20px_rgba(255,107,53,0.35)] transition-transform hover:scale-105 active:scale-95"
            >
                <span className="w-4 h-4 rounded-full bg-white animate-pulse" />
                録音を開始する
            </button>
        </PreGameFrame>
    );
};

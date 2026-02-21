import { useFlowStore } from '../../store/useFlowStore';
import { PreGameFrame } from './PreGameFrame';

export const Screen01Prepare = () => {
    const { setScreen, currentPlayerIndex, language } = useFlowStore();
    const isEn = language === 'en';

    const handleStartRecording = async () => {
        try {
            console.log("Mock: Mic permission granted");
            setScreen("LISTENING");
        } catch {
            alert(isEn ? "Please allow microphone access." : "マイクへのアクセスを許可してください");
        }
    };

    return (
        <PreGameFrame
            badge={`🎤 PLAYER ${currentPlayerIndex + 1}`}
            title={isEn ? `Player ${currentPlayerIndex + 1} Introduction` : `Player ${currentPlayerIndex + 1} の自己紹介`}
            description={(
                <>
                    {isEn
                        ? 'Please speak freely into the mic about your name, hobbies, and current interests.'
                        : '名前・趣味・最近ハマっていることなど、'}
                    {!isEn && <br />}
                    {isEn ? null : '自由にマイクへ話してください。'}
                </>
            )}
        >
            <div className="mx-auto max-w-md space-y-6">
                {/* Tips card */}
                <div
                    className="rounded-2xl border-[2.5px] border-[#E8D5A0] bg-white px-5 py-4 text-left"
                >
                    <div className="mb-2 text-sm font-bold text-[#B8A07A]">{isEn ? '💡 Speaking Tips' : '💡 話すヒント'}</div>
                    <ul className="space-y-1 text-sm text-[#7A6850]">
                        <li>{isEn ? '• Your name or nickname' : '• お名前やニックネーム'}</li>
                        <li>{isEn ? '• Your hobbies or favorite things' : '• 趣味や好きなこと'}</li>
                        <li>{isEn ? '• What you are currently into' : '• 最近ハマっていること'}</li>
                        <li>{isEn ? '• A surprising skill or unique preference' : '• 意外な特技やこだわり'}</li>
                    </ul>
                </div>

                <button
                    onClick={handleStartRecording}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border-[3px] border-[#E8708A] px-10 py-5 text-xl font-black text-[#5D4220] shadow-[0_6px_20px_rgba(232,112,138,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #FFE44D, #FFD700)' }}
                >
                    <span className="relative flex h-4 w-4">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E8708A] opacity-60" />
                        <span className="relative inline-flex h-4 w-4 rounded-full bg-[#E8708A]" />
                    </span>
                    {isEn ? 'Start Recording' : '録音を開始する'}
                </button>
            </div>
        </PreGameFrame>
    );
};

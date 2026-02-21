import { useFlowStore } from '../../store/useFlowStore';
import { PreGameFrame } from './PreGameFrame';

export const Screen00Title = () => {
    const setScreen = useFlowStore((state) => state.setScreen);

    return (
        <PreGameFrame
            badge="WELCOME"
            title="LifeLoop"
            description={(
                <>
                    自己紹介から始まる、あなただけのハッカソンすごろく。<br />
                    プレイヤー情報から世界とイベントを生成します。
                </>
            )}
        >
            <button
                onClick={() => setScreen("PREPARE")}
                className="rounded-full border-2 border-[#4A3728]/15 bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-10 py-4 text-2xl font-black text-white shadow-[0_8px_20px_rgba(255,107,53,0.35)] transition-transform hover:scale-105 active:scale-95"
            >
                はじめる
            </button>
            <div className="mt-8 text-xs font-semibold tracking-wide text-[#8B7355]">
                Built with Gemini Live API & Nano Banana
            </div>
        </PreGameFrame>
    );
};

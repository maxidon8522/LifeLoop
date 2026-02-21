import { useFlowStore } from '../../store/useFlowStore';
import { PreGameFrame } from './PreGameFrame';

export const Screen00Title = () => {
    const { setScreen, language, setLanguage } = useFlowStore();
    const isEn = language === 'en';

    return (
        <PreGameFrame
            badge="🎲 WELCOME"
            title="LifeLoop"
            description={(
                <>
                    {isEn
                        ? 'A one-of-a-kind board game journey that begins with self-introductions.'
                        : '自己紹介から始まる、あなただけのすごろく体験。'}
                    <br />
                    {isEn
                        ? 'AI automatically creates the world and events from player profiles.'
                        : 'AIがプレイヤー情報から世界とイベントを自動生成します。'}
                </>
            )}
        >
            <div className="mx-auto mb-6 flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl border-[2.5px] border-[#E8D5A0] bg-[#FFFDF5] p-2">
                <button
                    type="button"
                    onClick={() => setLanguage('ja')}
                    className="rounded-xl px-4 py-2 text-sm font-black transition-all"
                    style={{
                        background: !isEn ? 'linear-gradient(135deg, #FFE44D, #FFD700)' : 'transparent',
                        color: '#5D4220',
                        border: !isEn ? '2px solid #DAA520' : '2px solid transparent',
                    }}
                >
                    日本語
                </button>
                <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className="rounded-xl px-4 py-2 text-sm font-black transition-all"
                    style={{
                        background: isEn ? 'linear-gradient(135deg, #FFE44D, #FFD700)' : 'transparent',
                        color: '#5D4220',
                        border: isEn ? '2px solid #DAA520' : '2px solid transparent',
                    }}
                >
                    English
                </button>
            </div>

            {/* Step indicators with colored borders */}
            <div className="mx-auto mb-10 flex max-w-md gap-3">
                {[
                    { icon: '🎤', text: isEn ? 'Intro' : '自己紹介', borderColor: '#DAA520' },
                    { icon: '🤖', text: isEn ? 'AI Analyze' : 'AI分析', borderColor: '#E74C8B' },
                    { icon: '🎮', text: isEn ? 'Board Game' : 'すごろく', borderColor: '#5BC4F0' },
                ].map((step, idx) => (
                    <div
                        key={idx}
                        className="flex-1 rounded-2xl border-[2.5px] bg-white px-3 py-3 text-center transition-transform hover:scale-105"
                        style={{ borderColor: step.borderColor }}
                    >
                        <div className="text-2xl">{step.icon}</div>
                        <div className="mt-1 text-xs font-bold text-[#6B563C]">{step.text}</div>
                    </div>
                ))}
            </div>

            {/* Big CTA button with pink border */}
            <button
                onClick={() => setScreen("PREPARE")}
                className="w-full max-w-sm rounded-2xl border-[3px] border-[#E8708A] px-12 py-5 text-2xl font-black text-[#5D4220] shadow-[0_6px_20px_rgba(232,112,138,0.2)] transition-all hover:scale-[1.02] hover:shadow-[0_8px_28px_rgba(232,112,138,0.3)] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #FFE44D, #FFD700)' }}
            >
                {isEn ? '🎲 Start' : '🎲 はじめる'}
            </button>

            <div className="mt-8 text-xs font-semibold tracking-wide text-[#B8A07A]">
                Built with Gemini Live API & Nano Banana 🍌
            </div>
        </PreGameFrame>
    );
};

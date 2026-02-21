import { PreGameFrame } from './PreGameFrame';
import { useFlowStore } from '../../store/useFlowStore';

export const Screen04Generating = () => {
    const { language } = useFlowStore();
    const isEn = language === 'en';

    return (
        <PreGameFrame
            badge="⚙️ GENERATING"
            title={isEn ? 'Generating World...' : '世界を生成中...'}
            description={(
                <>
                    {isEn
                        ? 'AI Director is analyzing player data and building the board and events.'
                        : 'AI Director がプレイヤー情報を分析し、'}
                    {!isEn && <br />}
                    {isEn ? null : '盤面とイベントを構築しています。'}
                </>
            )}
        >
            <div className="flex flex-col items-center">
                {/* Spinner */}
                <div className="relative mb-8 h-28 w-28">
                    <div className="absolute inset-0 animate-spin rounded-full border-[6px] border-transparent border-t-[#FFD700] border-r-[#E8708A]" />
                    <div
                        className="absolute inset-3 animate-spin rounded-full border-[5px] border-transparent border-l-[#DAA520] border-b-[#5BC4F0]"
                        style={{ animationDirection: 'reverse', animationDuration: '1.1s' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">
                        🎲
                    </div>
                </div>

                {/* Progress steps */}
                <div className="space-y-3 text-left">
                    {[
                        { icon: '✅', text: isEn ? 'Analyzing player profiles...' : 'プレイヤー情報を分析中...' },
                        { icon: '🔄', text: isEn ? 'Generating board theme...' : '盤面テーマを生成中...' },
                        { icon: '⏳', text: isEn ? 'Placing events...' : 'イベントを配置中...' },
                    ].map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <span className="text-lg">{step.icon}</span>
                            <span className="text-sm font-bold text-[#7A6850]">
                                {step.text}
                            </span>
                        </div>
                    ))}
                </div>

                <p className="mt-6 text-xs font-bold tracking-wider text-[#B8A07A]">
                    Powered by Gemini & Nano Banana 🍌
                </p>
            </div>
        </PreGameFrame>
    );
};

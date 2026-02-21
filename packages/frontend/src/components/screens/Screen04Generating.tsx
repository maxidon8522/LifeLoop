import { PreGameFrame } from './PreGameFrame';

export const Screen04Generating = () => {
    return (
        <PreGameFrame
            badge="GENERATING"
            title="世界を生成中..."
            description={(
                <>
                    AI Director がプレイヤー情報を分析し、<br />
                    盤面とイベントを構築しています。
                </>
            )}
        >
            <div className="flex flex-col items-center">
                <div className="relative mb-7 h-24 w-24">
                    <div className="absolute inset-0 animate-spin rounded-full border-[6px] border-transparent border-t-[#FF6B35] border-r-[#FFD700]" />
                    <div
                        className="absolute inset-3 animate-spin rounded-full border-[5px] border-transparent border-l-[#DAA520] border-b-[#C03070]"
                        style={{ animationDirection: 'reverse', animationDuration: '1.1s' }}
                    />
                </div>
                <p className="text-sm font-bold tracking-wider text-[#8B7355]">
                    Please wait...
                </p>
            </div>
        </PreGameFrame>
    );
};

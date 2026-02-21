import type { ReactNode } from 'react';

interface PreGameFrameProps {
    badge: string;
    title: string;
    description?: ReactNode;
    children: ReactNode;
    rightSlot?: ReactNode;
}

export const PreGameFrame = ({ badge, title, description, children, rightSlot }: PreGameFrameProps) => {
    return (
        <div
            className="relative min-h-screen overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #FFF9E0 0%, #FFF4CC 50%, #FFEEBB 100%)' }}
        >
            {/* Soft decorative blurs */}
            <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-[#FFE4A0]/40 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-[#FFD4A0]/30 blur-3xl" />
            <div className="absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-white/30 blur-3xl" />

            <div className="relative z-10 min-h-screen px-4 py-6 sm:px-8">
                {/* Top bar: badge + rightSlot */}
                <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-3">
                    {/* Badge - large yellow pill */}
                    <div
                        className="rounded-2xl border-[3px] border-[#DAA520] px-6 py-3 shadow-[0_4px_12px_rgba(218,165,32,0.2)]"
                        style={{ background: 'linear-gradient(135deg, #FFE44D, #FFD700)' }}
                    >
                        <div className="text-base font-black tracking-[0.12em] text-[#5D4220] sm:text-lg">
                            {badge}
                        </div>
                    </div>
                    {rightSlot}
                </div>

                {/* Main content card */}
                <div className="mx-auto mt-6 flex min-h-[72vh] w-full max-w-4xl items-center justify-center">
                    <div
                        className="w-full rounded-[28px] border-[3px] border-[#E8D5A0] px-6 py-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:px-10 sm:py-10"
                        style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF5 100%)' }}
                    >
                        <h1 className="text-3xl font-black text-[#4A3728] sm:text-5xl">{title}</h1>
                        {description && (
                            <div className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#7A6850] sm:text-lg">
                                {description}
                            </div>
                        )}
                        <div className="mx-auto mt-8 max-w-3xl">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

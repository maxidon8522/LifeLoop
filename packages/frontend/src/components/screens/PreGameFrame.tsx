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
        <div className="relative min-h-screen overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#a4d96c_0%,#84c958_45%,#70b749_100%)]" />
            <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute -bottom-16 -right-20 h-72 w-72 rounded-full bg-yellow-200/20 blur-2xl" />

            <div className="relative z-10 min-h-screen px-4 py-6 sm:px-8">
                <div className="mx-auto flex w-full max-w-5xl justify-between gap-3">
                    <div
                        className="rounded-xl border-[3px] border-[#DAA520] px-4 py-2 text-[#4A3728] shadow-md"
                        style={{ background: 'linear-gradient(135deg, #FFF8DC, #FFFACD)' }}
                    >
                        <div className="text-[11px] font-bold tracking-[0.16em] text-[#8B7355]">{badge}</div>
                    </div>
                    {rightSlot}
                </div>

                <div className="mx-auto mt-4 flex min-h-[78vh] w-full max-w-4xl items-center justify-center">
                    <div
                        className="w-full rounded-[28px] border-[3px] border-[#DAA520] px-6 py-8 text-center text-[#4A3728] shadow-[0_14px_40px_rgba(0,0,0,0.22)] sm:px-10 sm:py-10"
                        style={{ background: 'linear-gradient(180deg, #FFF9E5 0%, #FFF4CC 100%)' }}
                    >
                        <h1 className="text-3xl font-black sm:text-5xl">{title}</h1>
                        {description && <div className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#6B563C] sm:text-lg">{description}</div>}
                        <div className="mx-auto mt-8 max-w-3xl">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

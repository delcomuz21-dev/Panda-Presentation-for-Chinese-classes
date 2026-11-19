interface LoadingScreenProps {
  progress: number;
  status: string;
  visible: boolean;
}

export function LoadingScreen({ progress, status, visible }: LoadingScreenProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#09160f] text-[#F2EFE6] transition-opacity duration-500"
    >
      <div className="w-full max-w-md px-8 text-center">
        <p className="text-xs tracking-[0.28em] uppercase text-[#C9A66B]">
          Natural History Presentation
        </p>
        <h1 className="font-editorial mt-3 text-4xl font-semibold tracking-tight text-[#F2EFE6]">
          PANDA
        </h1>
        <p className="font-chinese mt-1 text-lg text-[#79A86B]">
          大熊猫 · 中国之旅
        </p>

        <div className="mt-8 h-1 w-full overflow-hidden bg-[#F2EFE6]/10">
          <div
            className="h-full bg-[#C9A66B] transition-all duration-200"
            style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-[#F2EFE6]/70">
          <span className="truncate pr-3">{status}</span>
          <span className="tabular-nums font-medium text-[#C9A66B]">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  );
}

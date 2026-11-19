import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  Languages,
  Library,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CHAPTERS } from '../data/curriculum';
import type { ChapterId, ExperienceMode, LanguageMode } from '../types/panda';

interface BottomControlDockProps {
  currentChapter: ChapterId;
  mode: ExperienceMode;
  language: LanguageMode;
  soundEnabled: boolean;
  paused: boolean;
  panelOpen: boolean;
  mandarinOpen: boolean;
  fullscreen: boolean;
  dockCollapsed: boolean;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onSelectChapter: (id: ChapterId) => void;
  onToggleMode: () => void;
  onToggleLanguage: () => void;
  onToggleSound: () => void;
  onTogglePause: () => void;
  onTogglePanel: () => void;
  onToggleMandarin: () => void;
  onOpenReferences: () => void;
  onToggleFullscreen: () => void;
  onToggleDockCollapsed: () => void;
}

export function BottomControlDock({
  currentChapter,
  mode,
  language,
  soundEnabled,
  paused,
  panelOpen,
  mandarinOpen,
  fullscreen,
  dockCollapsed,
  onPrevChapter,
  onNextChapter,
  onSelectChapter,
  onToggleMode,
  onToggleLanguage,
  onToggleSound,
  onTogglePause,
  onTogglePanel,
  onToggleMandarin,
  onOpenReferences,
  onToggleFullscreen,
  onToggleDockCollapsed,
}: BottomControlDockProps) {
  const activeChapter = CHAPTERS.find((c) => c.id === currentChapter)!;
  const progressPct = Math.round((currentChapter / CHAPTERS.length) * 100);

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-30 w-[min(980px,96vw)] -translate-x-1/2 transition-transform duration-300 ${
        dockCollapsed ? 'translate-y-[calc(100%-2.1rem)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Zen Handle */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onToggleDockCollapsed}
          aria-label={dockCollapsed ? 'Show Controls' : 'Hide Controls'}
          className="museum-surface inline-flex items-center gap-1.5 border-b-0 px-3.5 py-1 text-[11px] font-medium text-[#F2EFE6]/85 hover:text-[#C9A66B]"
        >
          {dockCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          <span>{dockCollapsed ? 'Show Controls' : 'Hide Controls'}</span>
        </button>
      </div>

      {/* Main Unified Control Dock */}
      <div className="museum-surface px-2.5 py-2 sm:px-4 sm:py-2.5 text-[#F2EFE6]">
        {/* Progress bar */}
        <div className="mb-2 sm:mb-2.5 flex items-center gap-3">
          <span className="tabular-nums text-[11px] font-semibold tracking-wider text-[#C9A66B] whitespace-nowrap">
            {activeChapter.numberLabel} / 09
          </span>
          <div className="h-1 flex-1 bg-[#F2EFE6]/12">
            <div
              className="h-full bg-[#C9A66B] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="hidden truncate text-xs text-[#F2EFE6]/80 sm:inline">
            {language === 'zh' ? activeChapter.titleZh : activeChapter.titleEn}
          </span>
        </div>

        {/* Single-Row Responsive Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          {/* Presenter Step & Direct Chapter Jump */}
          <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-start sm:gap-1.5">
            <button
              type="button"
              onClick={onPrevChapter}
              disabled={currentChapter === 1}
              aria-label="Previous Chapter"
              className="inline-flex h-8 sm:h-9 items-center gap-1 border border-[#F2EFE6]/18 px-1.5 sm:px-2.5 text-xs disabled:opacity-35 hover:border-[#C9A66B]"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <nav aria-label="Chapter Navigation" className="flex items-center gap-0.5 sm:gap-1">
              {CHAPTERS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => onSelectChapter(ch.id)}
                  aria-label={`Chapter ${ch.numberLabel}: ${ch.titleEn}`}
                  aria-current={currentChapter === ch.id ? 'step' : undefined}
                  className={`tabular-nums h-7 w-6 sm:h-8 sm:w-7 text-[11px] sm:text-xs font-semibold transition-colors ${
                    currentChapter === ch.id
                      ? 'bg-[#C9A66B] text-[#10251B]'
                      : 'border border-[#F2EFE6]/12 bg-[#171A18]/75 text-[#F2EFE6]/75 hover:border-[#C9A66B]/60 hover:text-[#F2EFE6]'
                  }`}
                >
                  {ch.id}
                </button>
              ))}
            </nav>

            <button
              type="button"
              onClick={onNextChapter}
              disabled={currentChapter === 9}
              aria-label="Next Chapter"
              className="inline-flex h-8 sm:h-9 items-center gap-1 border border-[#F2EFE6]/18 px-1.5 sm:px-2.5 text-xs disabled:opacity-35 hover:border-[#C9A66B]"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>

          {/* Utility & Presentation Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleMode}
              className="inline-flex h-9 items-center border border-[#F2EFE6]/18 px-2.5 text-xs font-medium whitespace-nowrap hover:border-[#C9A66B]"
              title="Switch between Presenter Slide Control and Scroll Exploration"
            >
              {mode === 'presenter' ? 'Presenter Mode' : 'Explore Mode'}
            </button>

            <button
              type="button"
              onClick={onToggleLanguage}
              aria-label="Toggle Chinese or English Language"
              className="inline-flex h-9 items-center gap-1.5 border border-[#F2EFE6]/18 px-2.5 text-xs font-medium whitespace-nowrap hover:border-[#C9A66B]"
            >
              <Languages className="h-3.5 w-3.5 text-[#C9A66B]" />
              <span>{language === 'en' ? 'EN / 中文' : '中文 / EN'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleMandarin}
              aria-label="Toggle Mandarin Vocabulary Panel"
              className={`inline-flex h-9 items-center gap-1.5 border px-2.5 text-xs font-medium whitespace-nowrap ${
                mandarinOpen
                  ? 'border-[#79A86B] bg-[#79A86B] text-[#10251B]'
                  : 'border-[#F2EFE6]/18 text-[#F2EFE6] hover:border-[#C9A66B]'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Mandarin</span>
            </button>

            <button
              type="button"
              onClick={onTogglePanel}
              aria-label={panelOpen ? 'Hide Chapter Info Panel' : 'Show Chapter Info Panel'}
              className="inline-flex h-9 w-9 items-center justify-center border border-[#F2EFE6]/18 hover:border-[#C9A66B]"
              title={panelOpen ? 'Hide Info Panel' : 'Show Info Panel'}
            >
              {panelOpen ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onTogglePause}
              aria-label={paused ? 'Resume 3D Animation' : 'Pause 3D Animation'}
              className="inline-flex h-9 w-9 items-center justify-center border border-[#F2EFE6]/18 hover:border-[#C9A66B]"
              title={paused ? 'Resume Animation' : 'Pause Animation'}
            >
              {paused ? <Play className="h-4 w-4 text-[#C9A66B]" /> : <Pause className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
              className="inline-flex h-9 w-9 items-center justify-center border border-[#F2EFE6]/18 hover:border-[#C9A66B]"
              title={soundEnabled ? 'Sound On' : 'Sound Off'}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-[#79A86B]" />
              ) : (
                <VolumeX className="h-4 w-4 text-[#F2EFE6]/60" />
              )}
            </button>

            <button
              type="button"
              onClick={onOpenReferences}
              aria-label="Open Scientific References"
              className="inline-flex h-9 w-9 items-center justify-center border border-[#F2EFE6]/18 hover:border-[#C9A66B]"
              title="Sources & References"
            >
              <Library className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={fullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="inline-flex h-9 w-9 items-center justify-center border border-[#F2EFE6]/18 hover:border-[#C9A66B]"
              title="Fullscreen"
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

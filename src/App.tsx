import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BottomControlDock } from './components/BottomControlDock';
import { ChapterOverlay } from './components/ChapterOverlay';
import { LoadingScreen } from './components/LoadingScreen';
import { MandarinDrawer } from './components/MandarinDrawer';
import { MandarinStudioModal } from './components/MandarinStudioModal';
import { ReferencesModal } from './components/ReferencesModal';
import { CHAPTERS, CONSERVATION_ACTIONS, VOCABULARY } from './data/curriculum';
import { PandaDocumentaryEngine } from './three/PandaDocumentaryEngine';
import type { PandaBehaviorMode } from './three/pandaModel';
import type { ChapterId, ExperienceMode, LanguageMode } from './types/panda';
import { audioManager } from './utils/audioManager';
import {
  calculateRestorationIntegrity,
  clampChapter,
} from './utils/learningLogic';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<PandaDocumentaryEngine | null>(null);

  const autostart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }, []);

  const [loadProgress, setLoadProgress] = useState(autostart ? 100 : 10);
  const [loadStatus, setLoadStatus] = useState('Preparing Natural History Environment');
  const [loadingVisible, setLoadingVisible] = useState(!autostart);

  const [currentChapter, setCurrentChapter] = useState<ChapterId>(1);
  const [visitedChapters, setVisitedChapters] = useState<ChapterId[]>([1]);
  const [learnedVocabIds, setLearnedVocabIds] = useState<string[]>(['da_xiongmao', 'zhongguo', 'keai']);

  const [mode, setMode] = useState<ExperienceMode>('presenter');
  const [language, setLanguage] = useState<LanguageMode>('en');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [paused, setPaused] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [mandarinOpen, setMandarinOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [referencesOpen, setReferencesOpen] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [webglFallback, setWebglFallback] = useState(false);

  // Interactive chapter lab states
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>('pseudo_thumb');
  const [selectedProvinceId, setSelectedProvinceId] = useState<'sichuan' | 'shaanxi' | 'gansu'>('sichuan');
  const [routineMode, setRoutineMode] = useState<PandaBehaviorMode>('eating');
  const [growthStage, setGrowthStage] = useState<'newborn' | 'juvenile' | 'adult'>('newborn');
  const [selectedActions, setSelectedActions] = useState<string[]>(['bamboo_corridors']);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('washington');

  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);

  const restorationIntegrity = useMemo(
    () => calculateRestorationIntegrity(selectedActions, CONSERVATION_ACTIONS),
    [selectedActions],
  );

  const chapterMeta = useMemo(
    () => CHAPTERS.find((c) => c.id === currentChapter) || CHAPTERS[0],
    [currentChapter],
  );

  const chapterVocab = useMemo(
    () => VOCABULARY.filter((v) => v.chapterId === currentChapter),
    [currentChapter],
  );

  const navigateToChapter = useCallback(
    (nextId: ChapterId) => {
      const clamped = clampChapter(nextId);
      setCurrentChapter(clamped);
      setVisitedChapters((prev) => (prev.includes(clamped) ? prev : [...prev, clamped]));
      const newlyUnlocked = VOCABULARY.filter((v) => v.chapterId === clamped).map((v) => v.id);
      setLearnedVocabIds((prev) => Array.from(new Set([...prev, ...newlyUnlocked])));
      if (soundEnabled) {
        audioManager.playTransitionCue(clamped);
      }
    },
    [soundEnabled],
  );

  const handleSpeak = useCallback((text: string, vocabId?: string) => {
    if (vocabId) {
      setLearnedVocabIds((prev) => (prev.includes(vocabId) ? prev : [...prev, vocabId]));
    }
    audioManager.speakMandarin(text);
  }, []);

  // Stable refs for 3D engine callbacks
  const callbacksRef = useRef({
    onHotspotSelect: (id: string) => {
      setSelectedHotspotId(id);
      setPanelOpen(true);
    },
    onProvinceSelect: (id: 'sichuan' | 'shaanxi' | 'gansu') => {
      setSelectedProvinceId(id);
      setPanelOpen(true);
    },
    onPartnerSelect: (id: string) => {
      setSelectedPartnerId(id);
      setPanelOpen(true);
    },
  });

  // Mount Three.js WebGL Engine once
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    try {
      const engine = new PandaDocumentaryEngine(mount, {
        onLoadProgress: (pct, msg) => {
          setLoadProgress(pct);
          setLoadStatus(msg);
        },
        onHotspotSelect: (id) => callbacksRef.current.onHotspotSelect(id),
        onProvinceSelect: (id) => callbacksRef.current.onProvinceSelect(id),
        onPartnerSelect: (id) => callbacksRef.current.onPartnerSelect(id),
      });
      engineRef.current = engine;

      if (!autostart) {
        const timer = window.setTimeout(() => setLoadingVisible(false), 650);
        return () => {
          clearTimeout(timer);
          engine.dispose();
          engineRef.current = null;
        };
      }
      return () => {
        engine.dispose();
        engineRef.current = null;
      };
    } catch {
      setWebglFallback(true);
      setLoadingVisible(false);
    }
  }, [autostart]);

  // Sync React scene options to Three.js engine without tearing down canvas
  useEffect(() => {
    engineRef.current?.updateOptions({
      chapter: currentChapter,
      paused,
      reducedMotion,
      selectedHotspotId,
      selectedProvinceId,
      routineMode,
      growthStage,
      restorationIntegrity,
      selectedPartnerId,
    });
  }, [
    currentChapter,
    paused,
    reducedMotion,
    selectedHotspotId,
    selectedProvinceId,
    routineMode,
    growthStage,
    restorationIntegrity,
    selectedPartnerId,
  ]);

  // Reflect state on body for clean automated diagnostics
  useEffect(() => {
    document.body.dataset.chapter = String(currentChapter);
    document.body.dataset.mode = mode;
    document.body.dataset.language = language;
  }, [currentChapter, mode, language]);

  // Keyboard shortcuts for University Class Presenter Control
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        navigateToChapter(clampChapter(currentChapter + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        navigateToChapter(clampChapter(currentChapter - 1));
      } else if (e.key >= '1' && e.key <= '9') {
        navigateToChapter(Number(e.key) as ChapterId);
      } else if (e.key.toLowerCase() === 'h') {
        setDockCollapsed((c) => !c);
      } else if (e.key.toLowerCase() === 'm') {
        setMandarinOpen((o) => !o);
      } else if (e.key === ' ') {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentChapter, navigateToChapter]);

  // Exploration Mode scroll-wheel chapter navigation on outer stage
  useEffect(() => {
    if (mode !== 'explore') return;
    let wheelLock = 0;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement | null)?.closest('.museum-scrollbar')) return;
      // Avoid hijacking OrbitControls zoom in inspection chapters
      if (currentChapter === 2 || currentChapter === 3 || currentChapter === 7 || currentChapter === 8) {
        return;
      }
      const now = Date.now();
      if (now - wheelLock < 650) return;
      if (Math.abs(e.deltaY) > 35) {
        wheelLock = now;
        navigateToChapter(clampChapter(currentChapter + (e.deltaY > 0 ? 1 : -1)));
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [mode, currentChapter, navigateToChapter]);

  // Fullscreen listener
  useEffect(() => {
    const onFsChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioManager.setSoundEnabled(next);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      void document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0b1912] select-none">
      {/* Isolated WebGL Viewport Container */}
      <div
        ref={canvasMountRef}
        data-testid="three-viewport"
        className="absolute inset-0 h-full w-full"
      />

      {webglFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#10251B] p-8 text-center text-[#F2EFE6]">
          <div className="max-w-md border border-[#C9A66B]/30 p-6">
            <h2 className="font-editorial text-2xl font-semibold">3D WebGL Unavailable</h2>
            <p className="mt-2 text-sm text-[#F2EFE6]/75">
              Please enable hardware acceleration to view the interactive 3D scenes; all educational chapters and Mandarin exercises remain active.
            </p>
          </div>
        </div>
      )}

      {/* Three-Zone Museum Top Header */}
      <header className="fixed top-0 right-0 left-0 z-30 flex h-13 items-center justify-between gap-8 border-b border-[#F2EFE6]/12 bg-[#10251B]/90 px-6 text-[#F2EFE6]">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            navigateToChapter(1);
          }}
          className="font-editorial text-xl font-semibold tracking-wide text-[#F2EFE6] whitespace-nowrap shrink-0"
        >
          PANDA
        </a>

        <nav className="hidden items-center gap-6 text-xs font-medium text-[#F2EFE6]/80 md:flex">
          <button
            type="button"
            onClick={() => navigateToChapter(1)}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[#C9A66B]"
          >
            {language === 'zh' ? '序幕' : 'Introduction'}
          </button>
          <button
            type="button"
            onClick={() => navigateToChapter(2)}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[#C9A66B]"
          >
            {language === 'zh' ? '解剖实验室' : 'Anatomy Lab'}
          </button>
          <button
            type="button"
            onClick={() => navigateToChapter(6)}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[#C9A66B]"
          >
            {language === 'zh' ? '生态保护' : 'Conservation'}
          </button>
          <button
            type="button"
            onClick={() => navigateToChapter(9)}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[#C9A66B]"
          >
            {language === 'zh' ? '知识挑战' : 'Final Challenge'}
          </button>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={() => setStudioOpen(true)}
            className="border border-[#C9A66B]/60 bg-[#C9A66B] px-3.5 py-1.5 text-xs font-semibold text-[#10251B] whitespace-nowrap shrink-0 transition-colors hover:bg-[#d8b87f]"
          >
            {language === 'zh' ? '中文实验室' : 'Mandarin Studio'}
          </button>
        </div>
      </header>

      {/* Main Chapter Educational & Interactive Overlay */}
      <ChapterOverlay
        chapterMeta={chapterMeta}
        language={language}
        panelOpen={panelOpen}
        chapterVocab={chapterVocab}
        learnedIds={learnedVocabIds}
        onStartExploring={() => {
          if (!soundEnabled) {
            setSoundEnabled(true);
            audioManager.setSoundEnabled(true);
          }
          navigateToChapter(2);
        }}
        onSpeak={handleSpeak}
        onOpenMandarinPanel={() => setMandarinOpen(true)}
        selectedHotspotId={selectedHotspotId}
        onSelectHotspot={(id) => setSelectedHotspotId(id)}
        selectedProvinceId={selectedProvinceId}
        onSelectProvince={(id) => setSelectedProvinceId(id)}
        routineMode={routineMode}
        onSelectRoutineMode={(m) => setRoutineMode(m)}
        growthStage={growthStage}
        onSelectGrowthStage={(s) => setGrowthStage(s)}
        selectedActions={selectedActions}
        onToggleAction={(actionId) =>
          setSelectedActions((prev) =>
            prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId],
          )
        }
        selectedPartnerId={selectedPartnerId}
        onSelectPartner={(id) => setSelectedPartnerId(id)}
      />

      {/* Persistent Mandarin Learning Drawer */}
      <MandarinDrawer
        open={mandarinOpen}
        onClose={() => setMandarinOpen(false)}
        currentChapter={currentChapter}
        allVocab={VOCABULARY}
        learnedIds={learnedVocabIds}
        visitedChapters={visitedChapters}
        language={language}
        onSpeak={handleSpeak}
        onOpenStudio={() => setStudioOpen(true)}
      />

      {/* Unified Collapsible Bottom Control Dock */}
      <BottomControlDock
        currentChapter={currentChapter}
        mode={mode}
        language={language}
        soundEnabled={soundEnabled}
        paused={paused}
        panelOpen={panelOpen}
        mandarinOpen={mandarinOpen}
        fullscreen={fullscreen}
        dockCollapsed={dockCollapsed}
        onPrevChapter={() => navigateToChapter(clampChapter(currentChapter - 1))}
        onNextChapter={() => navigateToChapter(clampChapter(currentChapter + 1))}
        onSelectChapter={navigateToChapter}
        onToggleMode={() => setMode((m) => (m === 'presenter' ? 'explore' : 'presenter'))}
        onToggleLanguage={() => setLanguage((l) => (l === 'en' ? 'zh' : 'en'))}
        onToggleSound={handleToggleSound}
        onTogglePause={() => setPaused((p) => !p)}
        onTogglePanel={() => setPanelOpen((p) => !p)}
        onToggleMandarin={() => setMandarinOpen((o) => !o)}
        onOpenReferences={() => setReferencesOpen(true)}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleDockCollapsed={() => setDockCollapsed((c) => !c)}
      />

      {/* Mandarin Flashcards & Mini-Games Modal */}
      <MandarinStudioModal
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        vocabulary={VOCABULARY}
        language={language}
        onSpeak={handleSpeak}
      />

      {/* Scientific References Modal */}
      <ReferencesModal
        open={referencesOpen}
        onClose={() => setReferencesOpen(false)}
        language={language}
      />

      {/* Introductory Loading Curtain */}
      <LoadingScreen progress={loadProgress} status={loadStatus} visible={loadingVisible} />
    </div>
  );
}

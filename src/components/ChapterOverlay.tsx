import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  Globe2,
  HeartHandshake,
  Leaf,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Trees,
  Volume2,
} from 'lucide-react';
import { useState } from 'react';
import {
  ANATOMY_HOTSPOTS,
  BAMBOO_PARTS,
  CONSERVATION_ACTIONS,
  CONSERVATION_STATS,
  DAILY_ROUTINE_STAGES,
  DIPLOMACY_PARTNERS,
  ECOSYSTEM_SPECIES,
  FINAL_QUIZ_QUESTIONS,
  GROWTH_STAGES,
  HABITAT_PROVINCES,
} from '../data/curriculum';
import type { PandaBehaviorMode } from '../three/pandaModel';
import type {
  ChapterId,
  ChapterMeta,
  LanguageMode,
  VocabularyItem,
} from '../types/panda';
import { calculateRestorationIntegrity, scoreQuiz } from '../utils/learningLogic';
import { VocabCard } from './VocabCard';

interface ChapterOverlayProps {
  chapterMeta: ChapterMeta;
  language: LanguageMode;
  panelOpen: boolean;
  chapterVocab: VocabularyItem[];
  learnedIds: string[];
  onStartExploring: () => void;
  onSpeak: (text: string, vocabId?: string) => void;
  onOpenMandarinPanel: () => void;
  // Interactive chapter states
  selectedHotspotId: string | null;
  onSelectHotspot: (id: string) => void;
  selectedProvinceId: 'sichuan' | 'shaanxi' | 'gansu';
  onSelectProvince: (id: 'sichuan' | 'shaanxi' | 'gansu') => void;
  routineMode: PandaBehaviorMode;
  onSelectRoutineMode: (mode: PandaBehaviorMode) => void;
  growthStage: 'newborn' | 'juvenile' | 'adult';
  onSelectGrowthStage: (stage: 'newborn' | 'juvenile' | 'adult') => void;
  selectedActions: string[];
  onToggleAction: (actionId: string) => void;
  selectedPartnerId: string;
  onSelectPartner: (partnerId: string) => void;
}

export function ChapterOverlay({
  chapterMeta,
  language,
  panelOpen,
  chapterVocab,
  learnedIds,
  onStartExploring,
  onSpeak,
  onOpenMandarinPanel,
  selectedHotspotId,
  onSelectHotspot,
  selectedProvinceId,
  onSelectProvince,
  routineMode,
  onSelectRoutineMode,
  growthStage,
  onSelectGrowthStage,
  selectedActions,
  onToggleAction,
  selectedPartnerId,
  onSelectPartner,
}: ChapterOverlayProps) {
  const [innerTab, setInnerTab] = useState<'story' | 'vocab'>('story');
  const [selectedBambooPart, setSelectedBambooPart] = useState<'shoots' | 'leaves' | 'culms'>('shoots');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('golden_monkey');

  // Chapter 9 Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [sentenceBuilders, setSentenceBuilders] = useState<Record<string, string[]>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  if (!panelOpen) return null;

  const isCh1 = chapterMeta.id === 1;
  const activeHotspot =
    ANATOMY_HOTSPOTS.find((h) => h.id === selectedHotspotId) || ANATOMY_HOTSPOTS[3]; // default pseudo-thumb highlight
  const activeProvince =
    HABITAT_PROVINCES.find((p) => p.id === selectedProvinceId) || HABITAT_PROVINCES[0];
  const activeBamboo =
    BAMBOO_PARTS.find((b) => b.id === selectedBambooPart) || BAMBOO_PARTS[0];
  const activeGrowth =
    GROWTH_STAGES.find((g) => g.id === growthStage) || GROWTH_STAGES[0];
  const integrity = calculateRestorationIntegrity(selectedActions, CONSERVATION_ACTIONS);
  const activePartner =
    DIPLOMACY_PARTNERS.find((p) => p.id === selectedPartnerId) || DIPLOMACY_PARTNERS[1];
  const activeSpecies =
    ECOSYSTEM_SPECIES.find((s) => s.id === selectedSpeciesId) || ECOSYSTEM_SPECIES[0];

  const quizResult = scoreQuiz(FINAL_QUIZ_QUESTIONS, quizAnswers);
  const answeredCount = Object.keys(quizAnswers).length;

  return (
    <section
      aria-label={`Chapter ${chapterMeta.numberLabel}: ${chapterMeta.titleEn}`}
      className={`museum-surface fixed top-16 left-4 z-20 flex max-h-[calc(100dvh-16.5rem)] sm:max-h-[calc(100vh-11.5rem)] w-[min(450px,calc(100vw-2rem))] flex-col text-[#F2EFE6] transition-all duration-300`}
    >
      {/* Chapter Header */}
      <div className="border-b border-[#F2EFE6]/12 px-5 pt-4 pb-3.5">
        <div className="flex items-center justify-between gap-2 text-xs text-[#C9A66B]">
          <span className="tracking-[0.2em] uppercase">
            Chapter {chapterMeta.numberLabel} · {chapterMeta.pinyin}
          </span>
          <span className="font-chinese text-sm text-[#79A86B]">{chapterMeta.titleZh}</span>
        </div>

        <h1 className="font-editorial mt-1 text-2xl font-semibold tracking-tight text-[#F2EFE6] sm:text-3xl">
          {isCh1
            ? 'PANDA — A Journey Through China'
            : language === 'zh'
              ? chapterMeta.titleZh
              : chapterMeta.titleEn}
        </h1>
        <p className="mt-1 text-xs font-medium text-[#F2EFE6]/70">
          {isCh1
            ? 'Discover the Giant Panda. Explore China. Learn Mandarin.'
            : language === 'zh'
              ? chapterMeta.subtitleZh
              : chapterMeta.subtitleEn}
        </p>

        {/* Sub-navigation: Interactive Story vs Chapter Mandarin Vocab */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 border border-[#F2EFE6]/12 bg-[#171A18] p-1">
            <button
              type="button"
              onClick={() => setInnerTab('story')}
              className={`px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                innerTab === 'story'
                  ? 'bg-[#C9A66B] text-[#10251B]'
                  : 'text-[#F2EFE6]/75 hover:text-[#F2EFE6]'
              }`}
            >
              {language === 'zh' ? '章节探索' : 'Interactive Exhibit'}
            </button>
            <button
              type="button"
              onClick={() => setInnerTab('vocab')}
              className={`px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                innerTab === 'vocab'
                  ? 'bg-[#C9A66B] text-[#10251B]'
                  : 'text-[#F2EFE6]/75 hover:text-[#F2EFE6]'
              }`}
            >
              {language === 'zh'
                ? `中文词汇 (${chapterVocab.length})`
                : `Mandarin (${chapterVocab.length})`}
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenMandarinPanel}
            className="text-xs font-medium text-[#79A86B] underline-offset-4 hover:underline whitespace-nowrap"
          >
            {language === 'zh' ? '全部词汇表' : 'Full Glossary'}
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="museum-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {innerTab === 'vocab' ? (
          <div className="space-y-3">
            {chapterVocab.map((v) => (
              <VocabCard
                key={v.id}
                item={v}
                language={language}
                isLearned={learnedIds.includes(v.id)}
                onSpeak={onSpeak}
              />
            ))}
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-[#F2EFE6]/90">
              {language === 'zh' ? chapterMeta.summaryZh : chapterMeta.summaryEn}
            </p>

            <p className="border-y border-[#F2EFE6]/10 py-2 text-xs text-[#C9A66B]/90">
              {language === 'zh' ? chapterMeta.museumNoteZh : chapterMeta.museumNoteEn}
            </p>

            {/* CHAPTER 1: Title Entrance & Start Exploring */}
            {chapterMeta.id === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {chapterVocab.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => onSpeak(v.hanzi, v.id)}
                      className="border border-[#F2EFE6]/15 bg-[#171A18]/85 p-2.5 text-left transition-colors hover:border-[#C9A66B]"
                    >
                      <p className="font-chinese text-lg font-bold text-[#F2EFE6]">{v.hanzi}</p>
                      <p className="text-[11px] text-[#C9A66B]">{v.pinyin}</p>
                      <p className="mt-0.5 text-[11px] text-[#79A86B]">{v.english}</p>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onStartExploring}
                  className="inline-flex w-full items-center justify-center gap-2 bg-[#C9A66B] px-5 py-3 text-sm font-semibold text-[#10251B] transition-colors hover:bg-[#d8b982]"
                >
                  <span>
                    {language === 'zh' ? '开始探索 · Start Exploring' : 'Start Exploring'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* CHAPTER 2: Interactive 3D Anatomy Lab */}
            {chapterMeta.id === 2 && (
              <div className="space-y-3">
                <p className="text-xs tracking-[0.14em] uppercase text-[#C9A66B]">
                  {language === 'zh'
                    ? '点击 3D 模型热点或下方部位按钮'
                    : 'Click 3D Hotspots or Select Anatomical Region'}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {ANATOMY_HOTSPOTS.map((spot) => {
                    const active = activeHotspot.id === spot.id;
                    return (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() => onSelectHotspot(spot.id)}
                        className={`border px-3 py-2 text-left text-xs transition-colors ${
                          active
                            ? 'border-[#C9A66B] bg-[#C9A66B]/20 text-[#F2EFE6]'
                            : 'border-[#F2EFE6]/15 bg-[#171A18]/70 text-[#F2EFE6]/80 hover:border-[#C9A66B]/60'
                        }`}
                      >
                        <span className="font-medium">
                          {language === 'zh' ? spot.labelZh : spot.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="border border-[#C9A66B]/30 bg-[#171A18]/85 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-editorial text-lg font-semibold text-[#C9A66B]">
                      {language === 'zh' ? activeHotspot.labelZh : activeHotspot.labelEn}
                    </h3>
                    {activeHotspot.vocabId && (
                      <button
                        type="button"
                        onClick={() => {
                          const v = chapterVocab.find((item) => item.id === activeHotspot.vocabId);
                          if (v) onSpeak(v.hanzi, v.id);
                        }}
                        className="inline-flex items-center gap-1 border border-[#F2EFE6]/20 px-2 py-1 text-xs text-[#F2EFE6]"
                      >
                        <Volume2 className="h-3 w-3 text-[#C9A66B]" />
                        <span>Pronounce</span>
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#F2EFE6]/85">
                    {language === 'zh' ? activeHotspot.summaryZh : activeHotspot.summaryEn}
                  </p>
                  <p className="mt-2 text-xs font-medium text-[#79A86B]">
                    {language === 'zh' ? activeHotspot.factZh : activeHotspot.factEn}
                  </p>
                </div>
              </div>
            )}

            {/* CHAPTER 3: 3D China Habitat Map */}
            {chapterMeta.id === 3 && (
              <div className="space-y-3">
                <p className="text-xs tracking-[0.14em] uppercase text-[#C9A66B]">
                  {language === 'zh'
                    ? '点击野生大熊猫核心分布省份'
                    : 'Select Wild Habitat Province (or Click 3D Beacons)'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {HABITAT_PROVINCES.map((prov) => {
                    const active = prov.id === activeProvince.id;
                    return (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => onSelectProvince(prov.id)}
                        className={`border p-2.5 text-left transition-colors ${
                          active
                            ? 'border-[#C9A66B] bg-[#C9A66B]/20'
                            : 'border-[#F2EFE6]/15 bg-[#171A18]/75 hover:border-[#C9A66B]/60'
                        }`}
                      >
                        <p className="font-chinese text-base font-bold text-[#F2EFE6]">
                          {prov.nameZh.replace('省（秦岭）', '').replace('省', '')}
                        </p>
                        <p className="text-[11px] text-[#C9A66B]">{prov.populationShare}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="border border-[#F2EFE6]/14 bg-[#171A18]/85 p-3.5">
                  <div className="flex items-center gap-2 text-[#C9A66B]">
                    <MapPin className="h-4 w-4" />
                    <h3 className="font-editorial text-lg font-semibold">
                      {language === 'zh' ? activeProvince.nameZh : activeProvince.nameEn}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-[#79A86B]">
                    {activeProvince.wildCount} · {activeProvince.elevation}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#F2EFE6]/85">
                    {language === 'zh' ? activeProvince.descriptionZh : activeProvince.descriptionEn}
                  </p>
                  <p className="mt-2 text-[11px] text-[#F2EFE6]/65">
                    Key Reserves: {activeProvince.keyReserves}
                  </p>
                </div>
              </div>
            )}

            {/* CHAPTER 4: Bamboo Feeding & Daily Routine */}
            {chapterMeta.id === 4 && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs tracking-[0.14em] uppercase text-[#C9A66B]">
                    {language === 'zh' ? '竹子部位互动探索' : 'Interactive Bamboo Part Explorer'}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {BAMBOO_PARTS.map((part) => (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => {
                          setSelectedBambooPart(part.id);
                          onSelectRoutineMode('eating');
                          onSpeak(part.nameZh);
                        }}
                        className={`border px-2.5 py-2 text-left text-xs transition-colors ${
                          selectedBambooPart === part.id
                            ? 'border-[#79A86B] bg-[#79A86B]/25 text-[#F2EFE6]'
                            : 'border-[#F2EFE6]/15 bg-[#171A18]/75 text-[#F2EFE6]/80'
                        }`}
                      >
                        <p className="font-chinese text-sm font-bold">{part.nameZh}</p>
                        <p className="text-[11px] text-[#C9A66B]">{part.pinyin}</p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 border border-[#F2EFE6]/12 bg-[#171A18]/85 p-3 text-xs">
                    <p className="font-semibold text-[#79A86B]">
                      {activeBamboo.nameEn} ({activeBamboo.seasonEn}) · {activeBamboo.digestibility}
                    </p>
                    <p className="mt-1 text-[#F2EFE6]/85">
                      {language === 'zh' ? activeBamboo.nutritionZh : activeBamboo.nutritionEn}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs tracking-[0.14em] uppercase text-[#C9A66B]">
                    {language === 'zh' ? '大熊猫日常行为模拟' : 'Daily Routine 3D Behavior'}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {DAILY_ROUTINE_STAGES.map((stage) => {
                      const mappedMode: PandaBehaviorMode =
                        stage.id === 'feeding' ? 'eating' : stage.id;
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => onSelectRoutineMode(mappedMode)}
                          className={`border px-3 py-2 text-left text-xs transition-colors ${
                            routineMode === mappedMode
                              ? 'border-[#C9A66B] bg-[#C9A66B]/20 text-[#F2EFE6]'
                              : 'border-[#F2EFE6]/15 bg-[#171A18]/75 text-[#F2EFE6]/80'
                          }`}
                        >
                          <p className="font-medium">
                            {language === 'zh' ? stage.labelZh : stage.labelEn}
                          </p>
                          <p className="text-[11px] text-[#C9A66B]">{stage.hoursPerDay}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 5: From Cub to Adult */}
            {chapterMeta.id === 5 && (
              <div className="space-y-3">
                <p className="text-xs tracking-[0.14em] uppercase text-[#C9A66B]">
                  {language === 'zh' ? '选择成长阶段以聚焦 3D 视图' : 'Select Life Stage to Focus 3D View'}
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {GROWTH_STAGES.map((stage) => (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => onSelectGrowthStage(stage.id)}
                      className={`border p-2.5 text-left text-xs transition-colors ${
                        growthStage === stage.id
                          ? 'border-[#C9A66B] bg-[#C9A66B]/20'
                          : 'border-[#F2EFE6]/15 bg-[#171A18]/75 hover:border-[#C9A66B]/60'
                      }`}
                    >
                      <p className="font-semibold text-[#F2EFE6]">
                        {language === 'zh' ? stage.ageRangeZh : stage.ageRangeEn}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#79A86B]">{stage.weight}</p>
                    </button>
                  ))}
                </div>

                <div className="border border-[#F2EFE6]/12 bg-[#171A18]/85 p-3.5 text-xs">
                  <h3 className="font-editorial text-lg font-semibold text-[#C9A66B]">
                    {language === 'zh' ? activeGrowth.titleZh : activeGrowth.titleEn}
                  </h3>
                  <p className="mt-1.5 leading-relaxed text-[#F2EFE6]/85">
                    {language === 'zh' ? activeGrowth.descriptionZh : activeGrowth.descriptionEn}
                  </p>
                  <p className="mt-2 text-[#79A86B]">
                    {language === 'zh' ? activeGrowth.careNoteZh : activeGrowth.careNoteEn}
                  </p>
                </div>
              </div>
            )}

            {/* CHAPTER 6: Conservation Restoration Simulation */}
            {chapterMeta.id === 6 && (
              <div className="space-y-3">
                <div className="border border-[#79A86B]/40 bg-[#171A18]/85 p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-[#F2EFE6]">
                      <Trees className="h-4 w-4 text-[#79A86B]" />
                      {language === 'zh' ? '栖息地恢复指数' : 'Habitat Integrity Score'}
                    </span>
                    <span className="tabular-nums font-bold text-[#C9A66B]">{integrity}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-[#F2EFE6]/10">
                    <div
                      className="h-full bg-[#79A86B] transition-all duration-300"
                      style={{ width: `${integrity}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {CONSERVATION_ACTIONS.map((action) => {
                    const active = selectedActions.includes(action.id);
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => onToggleAction(action.id)}
                        className={`flex w-full items-start justify-between gap-3 border p-3 text-left text-xs transition-colors ${
                          active
                            ? 'border-[#79A86B] bg-[#79A86B]/20'
                            : 'border-[#F2EFE6]/15 bg-[#171A18]/75 hover:border-[#C9A66B]/60'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-[#F2EFE6]">
                            {language === 'zh' ? action.titleZh : action.titleEn}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#C9A66B]">
                            {action.mandarinTerm} ({action.mandarinPinyin})
                          </p>
                        </div>
                        <span className="shrink-0 font-semibold text-[#79A86B]">
                          {active ? 'Active' : `+${action.impactPoints}%`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 border-t border-[#F2EFE6]/10 pt-3">
                  <p className="text-xs tracking-[0.14em] uppercase text-[#C9A66B]">
                    Verified Conservation Data
                  </p>
                  {CONSERVATION_STATS.map((stat) => (
                    <div key={stat.date} className="border border-[#F2EFE6]/10 bg-[#171A18]/70 p-2.5 text-xs">
                      <p className="font-semibold text-[#C9A66B]">
                        {stat.metric} · <span className="text-[#F2EFE6]/65">{stat.date}</span>
                      </p>
                      <p className="mt-0.5 text-[#F2EFE6]/85">
                        {language === 'zh' ? stat.labelZh : stat.labelEn}
                      </p>
                      <p className="mt-1 text-[11px] text-[#79A86B]">Source: {stat.source}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHAPTER 7: Panda Diplomacy Globe */}
            {chapterMeta.id === 7 && (
              <div className="space-y-3">
                <p className="text-xs tracking-[0.14em] uppercase text-[#C9A66B]">
                  {language === 'zh'
                    ? '选择国际合作城市（或点击 3D 地球坐标）'
                    : 'International Conservation Partners'}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {DIPLOMACY_PARTNERS.map((partner) => (
                    <button
                      key={partner.id}
                      type="button"
                      onClick={() => onSelectPartner(partner.id)}
                      className={`border px-3 py-2 text-left text-xs transition-colors ${
                        activePartner.id === partner.id
                          ? 'border-[#C9A66B] bg-[#C9A66B]/20'
                          : 'border-[#F2EFE6]/15 bg-[#171A18]/75 hover:border-[#C9A66B]/60'
                      }`}
                    >
                      <p className="font-semibold text-[#F2EFE6]">
                        {language === 'zh' ? partner.cityZh : partner.cityEn}
                      </p>
                      <p className="text-[11px] text-[#C9A66B]">{partner.yearEstablished}</p>
                    </button>
                  ))}
                </div>

                <div className="border border-[#F2EFE6]/14 bg-[#171A18]/85 p-3.5 text-xs">
                  <div className="flex items-center gap-2 text-[#C9A66B]">
                    <Globe2 className="h-4 w-4" />
                    <h3 className="font-editorial text-lg font-semibold">
                      {activePartner.institution}
                    </h3>
                  </div>
                  <p className="mt-1 text-[#79A86B]">
                    {activePartner.countryEn} · {activePartner.yearEstablished}
                  </p>
                  <p className="mt-2 leading-relaxed text-[#F2EFE6]/85">
                    {language === 'zh' ? activePartner.highlightZh : activePartner.highlightEn}
                  </p>
                </div>
              </div>
            )}

            {/* CHAPTER 8: Why Pandas Matter (Umbrella Species) */}
            {chapterMeta.id === 8 && (
              <div className="space-y-3">
                <p className="text-xs tracking-[0.14em] uppercase text-[#C9A66B]">
                  {language === 'zh' ? '伞护物种庇护的伴生生态' : 'Umbrella Species Ecosystem'}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {ECOSYSTEM_SPECIES.map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => {
                        setSelectedSpeciesId(sp.id);
                        onSpeak(sp.nameZh);
                      }}
                      className={`border p-2.5 text-left text-xs transition-colors ${
                        activeSpecies.id === sp.id
                          ? 'border-[#79A86B] bg-[#79A86B]/20'
                          : 'border-[#F2EFE6]/15 bg-[#171A18]/75 hover:border-[#C9A66B]/60'
                      }`}
                    >
                      <p className="font-chinese text-sm font-bold text-[#F2EFE6]">{sp.nameZh}</p>
                      <p className="text-[11px] text-[#C9A66B]">{sp.nameEn}</p>
                    </button>
                  ))}
                </div>

                <div className="border border-[#F2EFE6]/14 bg-[#171A18]/85 p-3.5 text-xs">
                  <div className="flex items-center gap-2 text-[#79A86B]">
                    <HeartHandshake className="h-4 w-4" />
                    <h3 className="font-editorial text-lg font-semibold text-[#F2EFE6]">
                      {language === 'zh' ? activeSpecies.nameZh : activeSpecies.nameEn}
                    </h3>
                  </div>
                  <p className="mt-1 text-[#C9A66B]">
                    {activeSpecies.pinyin} · {language === 'zh' ? activeSpecies.roleZh : activeSpecies.roleEn}
                  </p>
                  <p className="mt-2 leading-relaxed text-[#F2EFE6]/85">
                    {language === 'zh' ? activeSpecies.benefitZh : activeSpecies.benefitEn}
                  </p>
                </div>
              </div>
            )}

            {/* CHAPTER 9: Final Interactive Educational Quiz & Closing Message */}
            {chapterMeta.id === 9 && (
              <div className="space-y-4">
                {FINAL_QUIZ_QUESTIONS.map((q, qIdx) => {
                  const currentAns = quizAnswers[q.id];
                  const builtTokens = sentenceBuilders[q.id] || [];

                  return (
                    <div key={q.id} className="border border-[#F2EFE6]/14 bg-[#171A18]/85 p-3.5 text-xs">
                      <div className="flex items-center justify-between gap-2 text-[#C9A66B]">
                        <span className="tracking-[0.14em] uppercase">
                          Q{qIdx + 1} · {q.type}
                        </span>
                        {q.audioText && (
                          <button
                            type="button"
                            onClick={() => onSpeak(q.audioText!)}
                            className="inline-flex items-center gap-1 border border-[#C9A66B]/45 px-2 py-1 text-[11px] text-[#C9A66B]"
                          >
                            <Volume2 className="h-3 w-3" />
                            <span>Listen</span>
                          </button>
                        )}
                      </div>

                      <p className="mt-2 text-sm font-medium text-[#F2EFE6]">
                        {language === 'zh' ? q.promptZh : q.promptEn}
                      </p>

                      {q.type === 'sentence' && q.sentenceTokens ? (
                        <div className="mt-2.5 space-y-2">
                          <div className="min-h-10 border border-dashed border-[#C9A66B]/40 bg-[#10251B] p-2">
                            {builtTokens.length === 0 ? (
                              <span className="text-[11px] text-[#F2EFE6]/45">
                                Click Chinese tiles below to construct the sentence...
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {builtTokens.map((tok, tIdx) => (
                                  <button
                                    key={`${tok}-${tIdx}`}
                                    type="button"
                                    onClick={() => {
                                      const next = builtTokens.filter((_, i) => i !== tIdx);
                                      setSentenceBuilders((prev) => ({ ...prev, [q.id]: next }));
                                      setQuizAnswers((prev) => ({ ...prev, [q.id]: next.join('') }));
                                    }}
                                    className="font-chinese border border-[#C9A66B] bg-[#C9A66B]/20 px-2 py-1 text-sm text-[#F2EFE6]"
                                  >
                                    {tok}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {q.sentenceTokens.map((tok, tIdx) => {
                              const used = builtTokens.filter((t) => t === tok).length;
                              const avail = q.sentenceTokens!.filter((t) => t === tok).length;
                              const disabled = used >= avail;
                              return (
                                <button
                                  key={`${tok}-opt-${tIdx}`}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => {
                                    const next = [...builtTokens, tok];
                                    setSentenceBuilders((prev) => ({ ...prev, [q.id]: next }));
                                    setQuizAnswers((prev) => ({ ...prev, [q.id]: next.join('') }));
                                  }}
                                  className={`font-chinese border px-2.5 py-1 text-sm ${
                                    disabled
                                      ? 'border-[#F2EFE6]/10 text-[#F2EFE6]/25'
                                      : 'border-[#F2EFE6]/25 text-[#F2EFE6] hover:border-[#C9A66B]'
                                  }`}
                                >
                                  {tok}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2.5 space-y-1.5">
                          {q.options?.map((opt) => {
                            const picked = currentAns === opt.id;
                            const isCorrect = opt.id === q.correctAnswer;
                            let cls =
                              'border-[#F2EFE6]/15 bg-[#10251B]/65 text-[#F2EFE6]/85 hover:border-[#C9A66B]';
                            if (quizSubmitted) {
                              if (isCorrect) cls = 'border-[#79A86B] bg-[#79A86B]/25 text-[#F2EFE6]';
                              else if (picked) cls = 'border-rose-400/70 bg-rose-950/50';
                            } else if (picked) {
                              cls = 'border-[#C9A66B] bg-[#C9A66B]/20 text-[#F2EFE6]';
                            }
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  setQuizAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                                }
                                className={`flex w-full items-center justify-between border px-3 py-2 text-left transition-colors ${cls}`}
                              >
                                <span>{opt.label}</span>
                                {picked && <ChevronRight className="h-3.5 w-3.5 text-[#C9A66B]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {quizSubmitted && (
                        <p className="mt-2 text-[11px] text-[#79A86B]">
                          {language === 'zh' ? q.explanationZh : q.explanationEn}
                        </p>
                      )}
                    </div>
                  );
                })}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuizSubmitted(true)}
                    className="inline-flex flex-1 items-center justify-center gap-2 bg-[#C9A66B] px-4 py-2.5 text-xs font-semibold text-[#10251B]"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>
                      {language === 'zh'
                        ? `提交挑战 (${answeredCount}/${FINAL_QUIZ_QUESTIONS.length})`
                        : `Submit Final Challenge (${answeredCount}/${FINAL_QUIZ_QUESTIONS.length})`}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuizAnswers({});
                      setSentenceBuilders({});
                      setQuizSubmitted(false);
                    }}
                    aria-label="Reset Quiz"
                    className="inline-flex items-center justify-center border border-[#F2EFE6]/20 p-2.5 text-[#F2EFE6]/80 hover:border-[#C9A66B]"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>

                {quizSubmitted && (
                  <div className="border border-[#C9A66B]/45 bg-[#10251B] p-4">
                    <div className="flex items-center gap-2 text-[#C9A66B]">
                      <Award className="h-5 w-5" />
                      <h3 className="font-editorial text-xl font-semibold">
                        {quizResult.correct} / {quizResult.total} ({quizResult.percent}%) ·{' '}
                        {language === 'zh' ? quizResult.tierZh : quizResult.tierEn}
                      </h3>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#F2EFE6]/90">
                      {language === 'zh' ? quizResult.feedbackZh : quizResult.feedbackEn}
                    </p>

                    <div className="mt-4 border-t border-[#F2EFE6]/15 pt-3 text-center">
                      <p className="font-chinese text-lg font-bold text-[#F2EFE6]">
                        保护熊猫，保护自然。
                      </p>
                      <p className="text-xs text-[#C9A66B]">
                        Bǎohù xióngmāo, bǎohù zìrán. · Protect pandas, protect nature.
                      </p>
                      <p className="font-chinese mt-2 text-base font-semibold text-[#79A86B]">
                        谢谢大家！ · Xièxie dàjiā! · Thank you, everyone!
                      </p>
                      <button
                        type="button"
                        onClick={() => onSpeak('保护熊猫，保护自然。谢谢大家！')}
                        className="mt-2 inline-flex items-center gap-1.5 border border-[#C9A66B]/40 px-3 py-1.5 text-xs text-[#C9A66B]"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>Play Closing Message</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

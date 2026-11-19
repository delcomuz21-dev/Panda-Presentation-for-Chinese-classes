import { BookOpen, Sparkles, Volume2, X } from 'lucide-react';
import { useState } from 'react';
import { CHAPTERS } from '../data/curriculum';
import type { ChapterId, LanguageMode, VocabularyItem } from '../types/panda';
import { calculateVocabularyProgress } from '../utils/learningLogic';
import { VocabCard } from './VocabCard';

interface MandarinDrawerProps {
  open: boolean;
  onClose: () => void;
  currentChapter: ChapterId;
  allVocab: VocabularyItem[];
  learnedIds: string[];
  visitedChapters: ChapterId[];
  language: LanguageMode;
  onSpeak: (text: string, vocabId: string) => void;
  onOpenStudio: () => void;
}

export function MandarinDrawer({
  open,
  onClose,
  currentChapter,
  allVocab,
  learnedIds,
  visitedChapters,
  language,
  onSpeak,
  onOpenStudio,
}: MandarinDrawerProps) {
  const [filterScope, setFilterScope] = useState<'current' | 'unlocked' | 'all'>('current');

  if (!open) return null;

  const progress = calculateVocabularyProgress(learnedIds, allVocab.length);
  const visitedSet = new Set(visitedChapters);

  const visibleVocab = allVocab.filter((item) => {
    if (filterScope === 'current') return item.chapterId === currentChapter;
    if (filterScope === 'unlocked') return visitedSet.has(item.chapterId);
    return true;
  });

  const activeChapterMeta = CHAPTERS.find((c) => c.id === currentChapter);

  return (
    <aside
      aria-label="Mandarin Learning Panel"
      className="museum-surface fixed top-16 right-4 bottom-24 z-30 flex w-[min(420px,calc(100vw-2rem))] flex-col text-[#F2EFE6]"
    >
      <div className="flex items-center justify-between border-b border-[#F2EFE6]/12 px-5 py-4">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-[#C9A66B]">
            {language === 'zh' ? '中文学习系统' : 'Mandarin Learning Studio'}
          </p>
          <h2 className="font-editorial mt-0.5 text-xl font-semibold">
            {activeChapterMeta?.titleZh} · {activeChapterMeta?.pinyin}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Mandarin Learning Panel"
          className="inline-flex h-9 w-9 items-center justify-center border border-[#F2EFE6]/15 text-[#F2EFE6]/80 transition-colors hover:border-[#C9A66B] hover:text-[#C9A66B]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress & Studio Launcher */}
      <div className="border-b border-[#F2EFE6]/12 px-5 py-3.5">
        <div className="flex items-center justify-between text-xs text-[#F2EFE6]/80">
          <span>{language === 'zh' ? '词汇掌握进度' : 'Vocabulary Mastery'}</span>
          <span className="tabular-nums font-semibold text-[#C9A66B]">
            {progress.count} / {progress.total} ({progress.percent}%)
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full bg-[#F2EFE6]/10">
          <div
            className="h-full bg-[#79A86B] transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 border border-[#F2EFE6]/12 bg-[#171A18] p-1">
            <button
              type="button"
              onClick={() => setFilterScope('current')}
              className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                filterScope === 'current'
                  ? 'bg-[#79A86B] text-[#10251B]'
                  : 'text-[#F2EFE6]/75 hover:text-[#F2EFE6]'
              }`}
            >
              {language === 'zh' ? '本章词汇' : 'This Chapter'}
            </button>
            <button
              type="button"
              onClick={() => setFilterScope('unlocked')}
              className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                filterScope === 'unlocked'
                  ? 'bg-[#79A86B] text-[#10251B]'
                  : 'text-[#F2EFE6]/75 hover:text-[#F2EFE6]'
              }`}
            >
              {language === 'zh' ? '已解锁' : 'Reviewed'}
            </button>
            <button
              type="button"
              onClick={() => setFilterScope('all')}
              className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                filterScope === 'all'
                  ? 'bg-[#79A86B] text-[#10251B]'
                  : 'text-[#F2EFE6]/75 hover:text-[#F2EFE6]'
              }`}
            >
              {language === 'zh' ? '全部词汇' : 'All Words'}
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenStudio}
            className="inline-flex items-center gap-1.5 border border-[#C9A66B]/60 bg-[#C9A66B]/15 px-3 py-1.5 text-xs font-semibold text-[#C9A66B] whitespace-nowrap transition-colors hover:bg-[#C9A66B] hover:text-[#10251B]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{language === 'zh' ? '闪卡与小游戏' : 'Flashcards & Games'}</span>
          </button>
        </div>
      </div>

      {/* Vocabulary List */}
      <div className="museum-scrollbar flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {visibleVocab.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#F2EFE6]/65">
            <BookOpen className="mx-auto mb-2 h-6 w-6 text-[#C9A66B]/60" />
            <p>{language === 'zh' ? '暂无可复习词汇' : 'Explore chapters to unlock vocabulary.'}</p>
          </div>
        ) : (
          visibleVocab.map((item) => (
            <VocabCard
              key={item.id}
              item={item}
              language={language}
              isLearned={learnedIds.includes(item.id)}
              onSpeak={onSpeak}
            />
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[#F2EFE6]/12 px-5 py-2.5 text-xs text-[#F2EFE6]/60">
        <span className="flex items-center gap-1.5">
          <Volume2 className="h-3.5 w-3.5 text-[#C9A66B]" />
          {language === 'zh' ? '点击扬声器收听普通话发音' : 'Click speaker icons for Mandarin audio'}
        </span>
      </div>
    </aside>
  );
}

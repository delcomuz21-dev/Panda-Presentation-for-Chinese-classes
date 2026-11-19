import { Check, Volume2 } from 'lucide-react';
import type { LanguageMode, VocabularyItem } from '../types/panda';

interface VocabCardProps {
  item: VocabularyItem;
  language: LanguageMode;
  isLearned: boolean;
  onSpeak: (text: string, vocabId: string) => void;
  compact?: boolean;
}

export function VocabCard({
  item,
  language,
  isLearned,
  onSpeak,
  compact = false,
}: VocabCardProps) {
  return (
    <article className="border border-[#F2EFE6]/14 bg-[#171A18]/75 p-4 transition-colors hover:border-[#C9A66B]/45">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="font-chinese text-2xl font-bold tracking-wide text-[#F2EFE6]">
              {item.hanzi}
            </span>
            <span className="text-sm font-medium text-[#C9A66B]">{item.pinyin}</span>
          </div>
          <p className="mt-1 text-sm font-medium text-[#79A86B]">{item.english}</p>
        </div>

        <div className="flex items-center gap-1.5">
          {isLearned && (
            <span
              className="inline-flex items-center gap-1 text-xs text-[#79A86B]"
              title={language === 'zh' ? '已学习' : 'Reviewed'}
            >
              <Check className="h-3.5 w-3.5" />
            </span>
          )}
          <button
            type="button"
            onClick={() => onSpeak(item.hanzi, item.id)}
            aria-label={`Pronounce ${item.hanzi} (${item.pinyin})`}
            className="inline-flex h-9 w-9 items-center justify-center border border-[#C9A66B]/35 bg-[#10251B] text-[#F2EFE6] transition-colors hover:border-[#C9A66B] hover:text-[#C9A66B] focus-visible:outline-2 focus-visible:outline-[#C9A66B]"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!compact && (
        <>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-[#F2EFE6]/65">
            <span>{item.partOfSpeech}</span>
            <span aria-hidden="true">·</span>
            <span>{item.visualCue}</span>
          </div>

          <div className="mt-3 border-t border-[#F2EFE6]/10 pt-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-chinese text-sm text-[#F2EFE6]">{item.exampleHanzi}</p>
                <p className="mt-0.5 text-xs text-[#C9A66B]/90">{item.examplePinyin}</p>
                <p className="mt-0.5 text-xs text-[#F2EFE6]/70">{item.exampleEnglish}</p>
              </div>
              <button
                type="button"
                onClick={() => onSpeak(item.exampleHanzi, item.id)}
                aria-label={`Listen to example sentence for ${item.hanzi}`}
                className="shrink-0 border border-[#F2EFE6]/15 px-2.5 py-1 text-xs text-[#F2EFE6]/85 transition-colors hover:border-[#C9A66B]/60 hover:text-[#C9A66B]"
              >
                {language === 'zh' ? '朗读例句' : 'Sentence'}
              </button>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

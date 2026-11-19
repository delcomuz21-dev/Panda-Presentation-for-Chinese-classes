import { ArrowLeft, ArrowRight, CheckCircle2, RotateCw, Volume2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { LanguageMode, VocabularyItem } from '../types/panda';
import { evaluateSentenceOrder } from '../utils/learningLogic';

interface MandarinStudioModalProps {
  open: boolean;
  onClose: () => void;
  vocabulary: VocabularyItem[];
  language: LanguageMode;
  onSpeak: (text: string, vocabId?: string) => void;
}

type StudioTab = 'flashcards' | 'picture' | 'characters' | 'pinyin' | 'sentence' | 'listening';

const SENTENCE_EXERCISES = [
  {
    id: 's1',
    promptEn: 'Giant pandas live in China.',
    promptZh: '大熊猫生活在中国。',
    tokens: ['在', '中国', '大熊猫', '生活', '。'],
    expected: '大熊猫生活在中国。',
  },
  {
    id: 's2',
    promptEn: 'Bamboo is the giant panda’s main food.',
    promptZh: '竹子是大熊猫的主要食物。',
    tokens: ['主要食物', '竹子', '大熊猫的', '是', '。'],
    expected: '竹子是大熊猫的主要食物。',
  },
  {
    id: 's3',
    promptEn: 'Protect pandas, protect nature.',
    promptZh: '保护熊猫，保护自然。',
    tokens: ['保护自然', '，', '保护熊猫', '。'],
    expected: '保护熊猫，保护自然。',
  },
];

export function MandarinStudioModal({
  open,
  onClose,
  vocabulary,
  language,
  onSpeak,
}: MandarinStudioModalProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('flashcards');
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Mini-game round states
  const [roundIdx, setRoundIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [sentencePick, setSentencePick] = useState<string[]>([]);
  const [sentenceChecked, setSentenceChecked] = useState<boolean | null>(null);

  const quizPool = useMemo(() => {
    const target = vocabulary[roundIdx % vocabulary.length];
    const distractors = vocabulary
      .filter((v) => v.id !== target.id)
      .slice((roundIdx * 3) % Math.max(1, vocabulary.length - 4), ((roundIdx * 3) % Math.max(1, vocabulary.length - 4)) + 3);
    const options = [target, ...distractors].sort((a, b) => a.id.localeCompare(b.id));
    return { target, options };
  }, [vocabulary, roundIdx]);

  if (!open || vocabulary.length === 0) return null;

  const currentCard = vocabulary[cardIndex % vocabulary.length];
  const currentSentence = SENTENCE_EXERCISES[roundIdx % SENTENCE_EXERCISES.length];

  const advanceRound = () => {
    setRoundIdx((r) => r + 1);
    setSelectedChoice(null);
    setSentencePick([]);
    setSentenceChecked(null);
  };

  const tabs: { id: StudioTab; labelEn: string; labelZh: string }[] = [
    { id: 'flashcards', labelEn: 'Flashcards', labelZh: '词汇闪卡' },
    { id: 'picture', labelEn: 'Picture Match', labelZh: '图文配对' },
    { id: 'characters', labelEn: 'Hanzi Recognition', labelZh: '汉字辨识' },
    { id: 'pinyin', labelEn: 'Pinyin Match', labelZh: '拼音匹配' },
    { id: 'sentence', labelEn: 'Sentence Builder', labelZh: '连词成句' },
    { id: 'listening', labelEn: 'Listening', labelZh: '听力辨音' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mandarin Flashcards and Mini-Games"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="museum-surface-dark flex max-h-[90vh] w-full max-w-3xl flex-col text-[#F2EFE6]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F2EFE6]/12 px-6 py-4">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-[#C9A66B]">
              {language === 'zh' ? '互动语言实验室' : 'Mandarin Interactive Studio'}
            </p>
            <h2 className="font-editorial mt-0.5 text-2xl font-semibold">
              {language === 'zh' ? '闪卡复习与趣味中文挑战' : 'Flashcards & Language Mini-Games'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Mandarin Studio"
            className="inline-flex h-10 w-10 items-center justify-center border border-[#F2EFE6]/15 text-[#F2EFE6]/80 hover:border-[#C9A66B] hover:text-[#C9A66B]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-[#F2EFE6]/12 bg-[#10251B]/60 px-6 py-2.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedChoice(null);
                setSentencePick([]);
                setSentenceChecked(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#C9A66B] text-[#10251B]'
                  : 'text-[#F2EFE6]/75 hover:text-[#F2EFE6]'
              }`}
            >
              {language === 'zh' ? tab.labelZh : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="museum-scrollbar flex-1 overflow-y-auto p-6">
          {activeTab === 'flashcards' && (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-lg border border-[#C9A66B]/35 bg-[#10251B] p-8 text-center">
                <p className="text-xs tracking-[0.16em] uppercase text-[#C9A66B]">
                  Card {(cardIndex % vocabulary.length) + 1} / {vocabulary.length} ·{' '}
                  {currentCard.partOfSpeech}
                </p>

                <div className="my-6">
                  <p className="font-chinese text-5xl font-bold text-[#F2EFE6]">
                    {currentCard.hanzi}
                  </p>
                  {flipped && (
                    <div className="mt-5 space-y-2 border-t border-[#F2EFE6]/12 pt-4">
                      <p className="text-xl font-semibold text-[#C9A66B]">{currentCard.pinyin}</p>
                      <p className="text-lg text-[#79A86B]">{currentCard.english}</p>
                      <p className="text-xs text-[#F2EFE6]/65">{currentCard.visualCue}</p>
                      <div className="mt-3 bg-[#171A18]/80 p-3 text-left text-xs">
                        <p className="font-chinese text-sm text-[#F2EFE6]">
                          {currentCard.exampleHanzi}
                        </p>
                        <p className="mt-0.5 text-[#C9A66B]">{currentCard.examplePinyin}</p>
                        <p className="mt-0.5 text-[#F2EFE6]/75">{currentCard.exampleEnglish}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    className="inline-flex items-center gap-2 border border-[#C9A66B] bg-[#C9A66B] px-5 py-2.5 text-sm font-semibold text-[#10251B] transition-colors hover:bg-[#d8b87f]"
                  >
                    <RotateCw className="h-4 w-4" />
                    <span>{flipped ? 'Hide Meaning' : 'Reveal Pinyin & Meaning'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSpeak(currentCard.hanzi, currentCard.id)}
                    className="inline-flex items-center gap-2 border border-[#F2EFE6]/25 px-4 py-2.5 text-sm text-[#F2EFE6] hover:border-[#C9A66B]"
                  >
                    <Volume2 className="h-4 w-4 text-[#C9A66B]" />
                    <span>{language === 'zh' ? '朗读发音' : 'Listen'}</span>
                  </button>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFlipped(false);
                    setCardIndex((i) => (i - 1 + vocabulary.length) % vocabulary.length);
                  }}
                  className="inline-flex items-center gap-1.5 border border-[#F2EFE6]/20 px-4 py-2 text-xs hover:border-[#C9A66B]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFlipped(false);
                    setCardIndex((i) => (i + 1) % vocabulary.length);
                  }}
                  className="inline-flex items-center gap-1.5 border border-[#F2EFE6]/20 px-4 py-2 text-xs hover:border-[#C9A66B]"
                >
                  <span>Next Card</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {(activeTab === 'picture' ||
            activeTab === 'characters' ||
            activeTab === 'pinyin' ||
            activeTab === 'listening') && (
            <div className="mx-auto max-w-xl">
              <div className="border border-[#F2EFE6]/12 bg-[#10251B] p-6">
                <p className="text-xs tracking-[0.16em] uppercase text-[#C9A66B]">
                  {activeTab === 'picture' && 'Picture-to-Word Visual Cue'}
                  {activeTab === 'characters' && 'Chinese Character Recognition'}
                  {activeTab === 'pinyin' && 'Pinyin-to-Meaning Matching'}
                  {activeTab === 'listening' && 'Listening Comprehension'}
                </p>

                <div className="mt-4">
                  {activeTab === 'picture' && (
                    <p className="text-lg font-medium text-[#F2EFE6]">
                      Visual Scene: <span className="text-[#79A86B]">{quizPool.target.visualCue}</span>
                    </p>
                  )}
                  {activeTab === 'characters' && (
                    <p className="text-lg font-medium text-[#F2EFE6]">
                      Select the Chinese characters for:{' '}
                      <span className="text-[#C9A66B]">{quizPool.target.english}</span>
                    </p>
                  )}
                  {activeTab === 'pinyin' && (
                    <p className="text-2xl font-semibold text-[#C9A66B]">
                      {quizPool.target.pinyin}
                    </p>
                  )}
                  {activeTab === 'listening' && (
                    <div className="flex items-center justify-between gap-4 border border-[#C9A66B]/30 bg-[#171A18] p-4">
                      <div>
                        <p className="text-sm text-[#F2EFE6]/85">
                          {language === 'zh'
                            ? '点击按钮播放中文词汇发音，然后选出对应词语：'
                            : 'Play the Mandarin audio, then choose the matching word:'}
                        </p>
                        <p className="mt-1 text-xs text-[#C9A66B]">
                          Hint: {quizPool.target.pinyin}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSpeak(quizPool.target.hanzi, quizPool.target.id)}
                        className="inline-flex items-center gap-2 bg-[#C9A66B] px-4 py-2 text-xs font-semibold text-[#10251B]"
                      >
                        <Volume2 className="h-4 w-4" />
                        <span>Play Audio</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {quizPool.options.map((opt) => {
                    const isPicked = selectedChoice === opt.id;
                    const isRight = opt.id === quizPool.target.id;
                    let styleClass =
                      'border-[#F2EFE6]/18 bg-[#171A18]/80 text-[#F2EFE6] hover:border-[#C9A66B]';
                    if (selectedChoice) {
                      if (isRight) {
                        styleClass = 'border-[#79A86B] bg-[#79A86B]/25 text-[#F2EFE6]';
                      } else if (isPicked) {
                        styleClass = 'border-rose-400/70 bg-rose-950/50 text-[#F2EFE6]';
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedChoice(opt.id);
                          onSpeak(opt.hanzi, opt.id);
                        }}
                        className={`border p-3.5 text-left transition-colors ${styleClass}`}
                      >
                        {activeTab === 'pinyin' ? (
                          <>
                            <p className="text-sm font-semibold">{opt.english}</p>
                            <p className="font-chinese mt-1 text-xs text-[#F2EFE6]/70">
                              {opt.hanzi}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-chinese text-xl font-bold">{opt.hanzi}</p>
                            {selectedChoice && (
                              <p className="mt-1 text-xs text-[#C9A66B]">
                                {opt.pinyin} · {opt.english}
                              </p>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedChoice && (
                  <div className="mt-4 flex items-center justify-between border-t border-[#F2EFE6]/12 pt-4">
                    <p className="text-sm">
                      {selectedChoice === quizPool.target.id ? (
                        <span className="font-semibold text-[#79A86B]">
                          Correct! {quizPool.target.hanzi} ({quizPool.target.pinyin}) ={' '}
                          {quizPool.target.english}
                        </span>
                      ) : (
                        <span className="text-rose-300">
                          Correct answer: {quizPool.target.hanzi} ({quizPool.target.pinyin})
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={advanceRound}
                      className="bg-[#C9A66B] px-4 py-2 text-xs font-semibold text-[#10251B]"
                    >
                      Next Prompt
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sentence' && (
            <div className="mx-auto max-w-xl border border-[#F2EFE6]/12 bg-[#10251B] p-6">
              <p className="text-xs tracking-[0.16em] uppercase text-[#C9A66B]">
                Mandarin Sentence Construction
              </p>
              <p className="mt-2 text-lg font-medium text-[#F2EFE6]">
                Translate: “{currentSentence.promptEn}”
              </p>

              <div className="mt-4 min-h-14 border border-dashed border-[#C9A66B]/45 bg-[#171A18] p-3">
                {sentencePick.length === 0 ? (
                  <p className="text-xs text-[#F2EFE6]/50">
                    Click the Chinese word tiles below in correct grammatical order...
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {sentencePick.map((tok, idx) => (
                      <button
                        key={`${tok}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSentencePick((prev) => prev.filter((_, i) => i !== idx));
                          setSentenceChecked(null);
                        }}
                        className="font-chinese border border-[#C9A66B] bg-[#C9A66B]/20 px-3 py-1.5 text-base font-semibold text-[#F2EFE6]"
                      >
                        {tok}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {currentSentence.tokens.map((tok, idx) => {
                  const usedCount = sentencePick.filter((t) => t === tok).length;
                  const availCount = currentSentence.tokens.filter((t) => t === tok).length;
                  const disabled = usedCount >= availCount;
                  return (
                    <button
                      key={`${tok}-pool-${idx}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setSentencePick((prev) => [...prev, tok]);
                        setSentenceChecked(null);
                      }}
                      className={`font-chinese border px-3.5 py-2 text-base font-medium transition-colors ${
                        disabled
                          ? 'border-[#F2EFE6]/10 bg-[#171A18]/40 text-[#F2EFE6]/25'
                          : 'border-[#F2EFE6]/25 bg-[#171A18] text-[#F2EFE6] hover:border-[#C9A66B]'
                      }`}
                    >
                      {tok}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#F2EFE6]/12 pt-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const ok = evaluateSentenceOrder(sentencePick, currentSentence.expected);
                      setSentenceChecked(ok);
                      if (ok) onSpeak(currentSentence.expected);
                    }}
                    className="bg-[#79A86B] px-4 py-2 text-xs font-semibold text-[#10251B]"
                  >
                    Check Sentence
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSentencePick([]);
                      setSentenceChecked(null);
                    }}
                    className="border border-[#F2EFE6]/20 px-3 py-2 text-xs text-[#F2EFE6]/80"
                  >
                    Clear
                  </button>
                </div>

                <button
                  type="button"
                  onClick={advanceRound}
                  className="border border-[#C9A66B]/50 px-3.5 py-2 text-xs font-semibold text-[#C9A66B]"
                >
                  Next Sentence
                </button>
              </div>

              {sentenceChecked !== null && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <CheckCircle2
                    className={`h-4 w-4 ${sentenceChecked ? 'text-[#79A86B]' : 'text-rose-400'}`}
                  />
                  <span className={sentenceChecked ? 'text-[#79A86B]' : 'text-rose-300'}>
                    {sentenceChecked
                      ? `Excellent! ${currentSentence.expected}`
                      : `Not quite yet — expected: ${currentSentence.expected}`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

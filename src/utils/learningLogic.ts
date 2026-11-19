import type { ChapterId, ConservationAction, QuizQuestion, VocabularyItem } from '../types/panda';

export function clampChapter(id: number): ChapterId {
  if (id <= 1) return 1;
  if (id >= 9) return 9;
  return Math.round(id) as ChapterId;
}

export function calculateScrollChapter(scrollProgress: number, totalChapters = 9): ChapterId {
  const clamped = Math.max(0, Math.min(0.9999, scrollProgress));
  return clampChapter(Math.floor(clamped * totalChapters) + 1);
}

export function getUnlockedVocabulary(
  allVocab: VocabularyItem[],
  visitedChapters: ChapterId[],
): VocabularyItem[] {
  const visitedSet = new Set(visitedChapters);
  return allVocab.filter((item) => visitedSet.has(item.chapterId));
}

export function calculateVocabularyProgress(
  learnedIds: string[],
  totalCount: number,
): { count: number; total: number; percent: number } {
  if (totalCount <= 0) {
    return { count: 0, total: 0, percent: 0 };
  }
  const uniqueCount = new Set(learnedIds).size;
  const clampedCount = Math.min(uniqueCount, totalCount);
  return {
    count: clampedCount,
    total: totalCount,
    percent: Math.round((clampedCount / totalCount) * 100),
  };
}

export function calculateRestorationIntegrity(
  selectedActionIds: string[],
  actions: ConservationAction[],
): number {
  const selected = new Set(selectedActionIds);
  const raw = actions.reduce(
    (sum, action) => (selected.has(action.id) ? sum + action.impactPoints : sum),
    20, // baseline degraded corridor health
  );
  return Math.max(0, Math.min(100, raw));
}

export function evaluateSentenceOrder(tokens: string[], expectedSentence: string): boolean {
  const joined = tokens.join('').replace(/\s+/g, '');
  const normalizedExpected = expectedSentence.replace(/\s+/g, '');
  return joined === normalizedExpected;
}

export function scoreQuiz(
  questions: QuizQuestion[],
  answers: Record<string, string>,
): {
  correct: number;
  total: number;
  percent: number;
  tierEn: string;
  tierZh: string;
  feedbackEn: string;
  feedbackZh: string;
} {
  const total = questions.length;
  if (total === 0) {
    return {
      correct: 0,
      total: 0,
      percent: 0,
      tierEn: 'Explorer',
      tierZh: '探索者',
      feedbackEn: 'Complete the quiz to receive feedback.',
      feedbackZh: '完成测验以获取反馈。',
    };
  }

  let correct = 0;
  for (const q of questions) {
    const answer = answers[q.id];
    if (!answer) continue;
    if (q.type === 'sentence') {
      if (answer.replace(/\s+/g, '') === q.correctAnswer.replace(/\s+/g, '')) {
        correct += 1;
      }
    } else if (answer === q.correctAnswer) {
      correct += 1;
    }
  }

  const percent = Math.round((correct / total) * 100);

  if (percent >= 85) {
    return {
      correct,
      total,
      percent,
      tierEn: 'Senior Panda Conservation Scholar',
      tierZh: '大熊猫保护资深学者',
      feedbackEn:
        'Outstanding mastery! You connected giant panda ecology, global conservation milestones, and Mandarin vocabulary with precision.',
      feedbackZh:
        '表现卓越！您精准掌握了大熊猫生态知识、全球保护里程碑以及相关中文词汇。',
    };
  }

  if (percent >= 60) {
    return {
      correct,
      total,
      percent,
      tierEn: 'Mountain Reserve Naturalist',
      tierZh: '山地保护区自然观察员',
      feedbackEn:
        'Great work! You have a strong foundation in panda biology and key Mandarin terms—review a few flashcards to reach full mastery.',
      feedbackZh:
        '表现出色！您已掌握大熊猫生态与核心中文词汇，复习词汇卡片即可达到满分水平。',
    };
  }

  return {
    correct,
    total,
    percent,
    tierEn: 'Bamboo Forest Apprentice',
    tierZh: '竹林见习探索者',
    feedbackEn:
      'A thoughtful start! Revisit the Anatomy Lab and Mandarin Learning Panel to reinforce key terms before retaking the challenge.',
    feedbackZh:
      '不错的起点！建议重温解剖实验室与中文学习面板，巩固核心词汇后再挑战一次。',
  };
}

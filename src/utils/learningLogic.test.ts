import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRestorationIntegrity,
  calculateScrollChapter,
  calculateVocabularyProgress,
  clampChapter,
  evaluateSentenceOrder,
  getUnlockedVocabulary,
  scoreQuiz,
} from './learningLogic';
import { CONSERVATION_ACTIONS, FINAL_QUIZ_QUESTIONS, VOCABULARY } from '../data/curriculum';

test('clampChapter bounds chapter numbers safely between 1 and 9', () => {
  assert.equal(clampChapter(-2), 1);
  assert.equal(clampChapter(1), 1);
  assert.equal(clampChapter(5.4), 5);
  assert.equal(clampChapter(14), 9);
});

test('calculateScrollChapter maps 0..1 progress to chapters 1..9', () => {
  assert.equal(calculateScrollChapter(0), 1);
  assert.equal(calculateScrollChapter(0.5), 5);
  assert.equal(calculateScrollChapter(0.99), 9);
  assert.equal(calculateScrollChapter(1.2), 9);
});

test('getUnlockedVocabulary returns only words from visited chapters', () => {
  const unlocked = getUnlockedVocabulary(VOCABULARY, [1, 2]);
  assert.ok(unlocked.length >= 9);
  assert.ok(unlocked.every((v) => v.chapterId === 1 || v.chapterId === 2));
});

test('calculateVocabularyProgress deduplicates learned IDs and computes percentage', () => {
  const progress = calculateVocabularyProgress(['da_xiongmao', 'da_xiongmao', 'zhongguo'], 10);
  assert.deepEqual(progress, { count: 2, total: 10, percent: 20 });
});

test('calculateRestorationIntegrity accumulates conservation action impacts up to 100%', () => {
  assert.equal(calculateRestorationIntegrity([], CONSERVATION_ACTIONS), 20);
  assert.equal(
    calculateRestorationIntegrity(['bamboo_corridors', 'national_park'], CONSERVATION_ACTIONS),
    70,
  );
  assert.equal(
    calculateRestorationIntegrity(
      CONSERVATION_ACTIONS.map((a) => a.id),
      CONSERVATION_ACTIONS,
    ),
    100,
  );
});

test('evaluateSentenceOrder validates Chinese sentence token construction', () => {
  assert.equal(evaluateSentenceOrder(['大熊猫', '生活', '在', '中国', '。'], '大熊猫生活在中国。'), true);
  assert.equal(evaluateSentenceOrder(['中国', '在', '生活', '大熊猫', '。'], '大熊猫生活在中国。'), false);
});

test('scoreQuiz computes score, tier, and bilingual feedback', () => {
  const fullAnswers: Record<string, string> = {};
  for (const q of FINAL_QUIZ_QUESTIONS) {
    fullAnswers[q.id] = q.correctAnswer;
  }
  const perfect = scoreQuiz(FINAL_QUIZ_QUESTIONS, fullAnswers);
  assert.equal(perfect.correct, FINAL_QUIZ_QUESTIONS.length);
  assert.equal(perfect.percent, 100);
  assert.equal(perfect.tierEn, 'Senior Panda Conservation Scholar');

  const empty = scoreQuiz(FINAL_QUIZ_QUESTIONS, {});
  assert.equal(empty.correct, 0);
  assert.equal(empty.percent, 0);
  assert.equal(empty.tierEn, 'Bamboo Forest Apprentice');
});

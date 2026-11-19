export type ChapterId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type LanguageMode = 'en' | 'zh';

export type ExperienceMode = 'presenter' | 'explore';

export interface VocabularyItem {
  id: string;
  chapterId: ChapterId;
  hanzi: string;
  pinyin: string;
  english: string;
  visualCue: string;
  partOfSpeech: string;
  exampleHanzi: string;
  examplePinyin: string;
  exampleEnglish: string;
}

export interface AnatomyHotspot {
  id: string;
  labelEn: string;
  labelZh: string;
  vocabId?: string;
  position: [number, number, number];
  cameraOffset: [number, number, number];
  summaryEn: string;
  summaryZh: string;
  factEn: string;
  factZh: string;
}

export interface HabitatProvince {
  id: 'sichuan' | 'shaanxi' | 'gansu';
  nameEn: string;
  nameZh: string;
  pinyin: string;
  populationShare: string;
  wildCount: string;
  elevation: string;
  keyReserves: string;
  descriptionEn: string;
  descriptionZh: string;
  mapCoords: [number, number]; // [lon, lat]
  color: string;
}

export interface BambooPart {
  id: 'shoots' | 'culms' | 'leaves';
  nameEn: string;
  nameZh: string;
  pinyin: string;
  seasonEn: string;
  seasonZh: string;
  nutritionEn: string;
  nutritionZh: string;
  digestibility: string;
}

export interface DailyRoutineStage {
  id: 'feeding' | 'resting' | 'climbing' | 'roaming';
  labelEn: string;
  labelZh: string;
  hoursPerDay: string;
  descriptionEn: string;
  descriptionZh: string;
}

export interface GrowthStage {
  id: 'newborn' | 'juvenile' | 'adult';
  ageRangeEn: string;
  ageRangeZh: string;
  weight: string;
  titleEn: string;
  titleZh: string;
  descriptionEn: string;
  descriptionZh: string;
  careNoteEn: string;
  careNoteZh: string;
}

export interface ConservationAction {
  id: string;
  titleEn: string;
  titleZh: string;
  mandarinTerm: string;
  mandarinPinyin: string;
  impactPoints: number;
  descriptionEn: string;
  descriptionZh: string;
}

export interface ConservationStat {
  metric: string;
  labelEn: string;
  labelZh: string;
  date: string;
  source: string;
}

export interface DiplomacyPartner {
  id: string;
  cityEn: string;
  countryEn: string;
  cityZh: string;
  institution: string;
  yearEstablished: string;
  lat: number;
  lon: number;
  highlightEn: string;
  highlightZh: string;
}

export interface EcosystemSpecies {
  id: string;
  nameEn: string;
  nameZh: string;
  pinyin: string;
  roleEn: string;
  roleZh: string;
  benefitEn: string;
  benefitZh: string;
}

export type QuizQuestionType = 'knowledge' | 'vocab-match' | 'listening' | 'sentence';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  promptEn: string;
  promptZh: string;
  audioText?: string;
  options?: { id: string; label: string; sublabel?: string }[];
  sentenceTokens?: string[];
  correctAnswer: string;
  explanationEn: string;
  explanationZh: string;
}

export interface ReferenceSource {
  id: string;
  organization: string;
  title: string;
  year: string;
  url: string;
  note: string;
}

export interface ChapterMeta {
  id: ChapterId;
  numberLabel: string;
  titleEn: string;
  titleZh: string;
  pinyin: string;
  subtitleEn: string;
  subtitleZh: string;
  summaryEn: string;
  summaryZh: string;
  museumNoteEn: string;
  museumNoteZh: string;
  vocabIds: string[];
}

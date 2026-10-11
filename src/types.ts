// Types for trusted, developer-authored practice content.
// These interfaces do not validate arbitrary imported JSON at runtime.

export interface LocalizedText {
  en: string;
  "zh-Hant"?: string;
  "zh-Hans"?: string;
  vi?: string;
  ko?: string;
  ne?: string;
  id?: string;
  my?: string;
  pt?: string;
}

export interface RubySegment {
  t: string;
  r?: string;
}

export interface JaText {
  text: string;
  ruby: RubySegment[];
  romaji?: string;
  gloss?: LocalizedText;
}

export type Politeness = "plain" | "polite" | "service";

export interface Expression {
  id: string;
  ja: JaText;
  usage_note: LocalizedText;
  politeness: Politeness;
  pitfall?: LocalizedText;
}

export interface ChoiceOption {
  id: string;
  ja?: JaText;
  text?: LocalizedText;
}

export interface MeaningChoiceItem {
  id: string;
  type: "meaning_choice";
  prompt: LocalizedText;
  stimulus: JaText;
  options: ChoiceOption[];
  answer_option_id: string;
  explanation: LocalizedText;
}

export interface SentenceOrderToken {
  id: string;
  ja: JaText;
}

export interface SentenceOrderItem {
  id: string;
  type: "sentence_order";
  prompt: LocalizedText;
  tokens: SentenceOrderToken[];
  distractor_token_ids?: string[];
  answer_order: string[];
  display_order: string[];
  explanation: LocalizedText;
}

export interface SituationalChoiceItem {
  id: string;
  type: "situational_choice";
  situation: LocalizedText;
  stimulus?: JaText;
  options: ChoiceOption[];
  answer_option_ids: string[];
  register_note?: LocalizedText;
  explanation: LocalizedText;
}

export interface ProduceCompareItem {
  id: string;
  type: "produce_compare";
  situation: LocalizedText;
  model_answers: JaText[];
  note?: LocalizedText;
  graded?: false;
}

export type AnyItem =
  | MeaningChoiceItem
  | SentenceOrderItem
  | SituationalChoiceItem
  | ProduceCompareItem;

export interface Scenario {
  id: string;
  title: LocalizedText;
  setting: LocalizedText;
  learner_role: LocalizedText;
  register_note?: LocalizedText;
}

export interface RealWorldMission {
  prompt: LocalizedText;
  safety_note?: LocalizedText;
}

export interface SelfRating {
  prompt: LocalizedText;
}

export type LevelHint = "intro" | "N5" | "N4" | "N3";

export interface DayTags {
  situation: string;
  grammar: string[];
  vocab_domains: string[];
  level_hint: LevelHint;
}

export interface Day {
  day_number: number;
  scenario: Scenario;
  minutes_estimate: number;
  targets: Expression[];
  items: AnyItem[];
  real_world_mission?: RealWorldMission;
  self_rating: SelfRating;
  review_of?: number[];
  tags: DayTags;
}

export interface PackChangelogEntry {
  version: string;
  note: string;
}

export type InstructionLocale =
  | "en" | "zh-Hant" | "zh-Hans" | "vi" | "ko" | "ne" | "id" | "my" | "pt";

export interface PackMeta {
  id: string;
  version: string;
  title: LocalizedText;
  description: LocalizedText;
  target_language: "ja";
  instruction_locales: InstructionLocale[];
  level_hint: LevelHint;
  day_count: number;
  published: boolean;
  changelog?: PackChangelogEntry[];
}

export interface MissionPack {
  schema_version: "1.0.0";
  pack: PackMeta;
  days: Day[];
}

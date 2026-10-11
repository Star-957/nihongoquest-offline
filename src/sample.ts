import type { Day, JaText, MissionPack } from './types.js';

// Original synthetic examples written for this public demo; no imported course,
// student, tutor, commercial pack or third-party learning material.
const ja = (text: string, romaji?: string): JaText => ({ text, ruby: [{ t: text }], ...(romaji ? { romaji } : {}) });
const water: JaText = { text: '水', ruby: [{ t: '水', r: 'みず' }], romaji: 'mizu' };

function practiceDay(number: number): Day {
  return {
    day_number: number,
    scenario: { id: `scene_${number}`, title: { en: number === 1 ? 'A little water' : 'Water, one more time' },
      setting: { en: 'Practise a short, polite request in an imaginary café.' }, learner_role: { en: 'A visitor' } },
    minutes_estimate: 3,
    targets: [{ id: 'water', ja: water, politeness: 'polite', usage_note: { en: 'The noun for water.' } }],
    items: [
      { id: 'meaning', type: 'meaning_choice', prompt: { en: 'What does this word mean?' }, stimulus: water,
        options: [{ id: 'water', text: { en: 'Water' } }, { id: 'book', text: { en: 'Book' } }],
        answer_option_id: 'water', explanation: { en: '水 (みず, mizu) means water.' } },
      { id: 'order', type: 'sentence_order', prompt: { en: 'Build “Water, please.” Tap a selected piece to remove it.' },
        tokens: [{ id: 'water', ja: water }, { id: 'object', ja: ja('を', 'o') },
          { id: 'please', ja: ja('ください', 'kudasai') }, { id: 'book', ja: ja('ほん', 'hon') }],
        distractor_token_ids: ['book'], answer_order: ['water', 'object', 'please'],
        display_order: ['please', 'book', 'water', 'object'], explanation: { en: '水をください is a polite request for water.' } },
      { id: 'situation', type: 'situational_choice', situation: { en: 'Someone gives you the water. Choose a polite thank-you.' },
        options: [{ id: 'thanks', ja: ja('ありがとうございます', 'arigatō gozaimasu') },
          { id: 'morning', ja: ja('おはようございます', 'ohayō gozaimasu') }], answer_option_ids: ['thanks'],
        explanation: { en: 'ありがとうございます means “Thank you.” The other expression is a morning greeting.' } },
      { id: 'try', type: 'produce_compare', situation: { en: 'Try writing “Water, please.” This is an ungraded comparison.' },
        model_answers: [ja('水をください', 'mizu o kudasai')], graded: false,
        note: { en: 'Your attempt stays in this text box. It is never saved or sent.' } }
    ],
    self_rating: { prompt: { en: 'How did the practice feel?' } },
    tags: { situation: 'imaginary-cafe', grammar: ['polite-request'], vocab_domains: ['everyday'], level_hint: 'intro' }
  };
}

export const samplePack: MissionPack = {
  schema_version: '1.0.0',
  pack: { id: 'pack_offline-demo', version: '1.0.0', title: { en: 'Small steps in Japanese' },
    description: { en: 'Two short synthetic practice days. The second repeats the first for review.' },
    target_language: 'ja', instruction_locales: ['en'], level_hint: 'intro', day_count: 2, published: true },
  days: [practiceDay(1), practiceDay(2)]
};

import type { MeaningChoiceItem, SentenceOrderItem,
  SituationalChoiceItem } from "./types.js";

export interface ItemResult { correct: boolean; correctIds: string[] }

export function gradeMeaningChoice(item: MeaningChoiceItem,
    chosenId: string): ItemResult {
  return { correct: chosenId === item.answer_option_id,
    correctIds: [item.answer_option_id] };
}
export function gradeSentenceOrder(item: SentenceOrderItem,
    ordered: readonly string[]): ItemResult {
  const ok = ordered.length === item.answer_order.length &&
    ordered.every((id, i) => id === item.answer_order[i]);
  return { correct: ok, correctIds: [...item.answer_order] };
}
export function gradeSituationalChoice(item: SituationalChoiceItem,
    chosenId: string): ItemResult {
  return { correct: item.answer_option_ids.includes(chosenId),
    correctIds: [...item.answer_option_ids] };
}

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
  // Check expected positions; iterating the submitted array would skip holes.
  const ok = ordered.length === item.answer_order.length &&
    item.answer_order.every((id, i) => Object.hasOwn(ordered, i) && ordered[i] === id);
  return { correct: ok, correctIds: [...item.answer_order] };
}
export function gradeSituationalChoice(item: SituationalChoiceItem,
    chosenId: string): ItemResult {
  return { correct: item.answer_option_ids.includes(chosenId),
    correctIds: [...item.answer_option_ids] };
}

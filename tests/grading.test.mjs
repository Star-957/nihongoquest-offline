import { test } from 'node:test';
import assert from 'node:assert/strict';
import { samplePack } from '../dist/src/sample.js';
import { gradeMeaningChoice, gradeSentenceOrder, gradeSituationalChoice } from '../dist/src/grading.js';

const [meaning, order, situation] = samplePack.days[0].items;
test('meaning choice accepts only its answer', () => {
  assert.equal(gradeMeaningChoice(meaning, 'water').correct, true);
  for (const wrong of ['book', '', 'unknown']) assert.equal(gradeMeaningChoice(meaning, wrong).correct, false);
});
test('sentence order requires exact tokens in exact order', () => {
  assert.equal(gradeSentenceOrder(order, order.answer_order).correct, true);
  for (const wrong of [[], ['water'], [...order.answer_order].reverse(), [...order.answer_order, 'book'], ['water', 'water', 'please']]) {
    assert.equal(gradeSentenceOrder(order, wrong).correct, false);
  }
});
const missingToken = [...order.answer_order];
delete missingToken[1];
const inheritedToken = [...missingToken];
delete inheritedToken[1];
Object.setPrototypeOf(inheritedToken, Object.assign(Object.create(Array.prototype), {
  1: order.answer_order[1]
}));
for (const [name, answer] of [
  ['all-hole', new Array(order.answer_order.length)],
  ['partially sparse', [order.answer_order[0], , order.answer_order[2]]],
  ['deleted-token', missingToken],
  ['inherited-token', inheritedToken]
]) {
  test(`sentence order rejects ${name} answer arrays`, () => {
    assert.equal(gradeSentenceOrder(order, answer).correct, false);
    assert.deepEqual(gradeSentenceOrder(order, answer).correctIds, order.answer_order);
  });
}
test('situational choice accepts all listed alternatives and rejects others', () => {
  const item = { ...situation, answer_option_ids: ['first', 'second'] };
  assert.equal(gradeSituationalChoice(item, 'first').correct, true);
  assert.equal(gradeSituationalChoice(item, 'second').correct, true);
  assert.equal(gradeSituationalChoice(item, 'unknown').correct, false);
});
test('grading cannot mutate the answer array via returned correctIds', () => {
  const before = JSON.stringify(order);
  gradeSentenceOrder(order, []).correctIds.push('extra');
  assert.equal(JSON.stringify(order), before);
});
test('synthetic content is self-consistent', () => {
  assert.equal(samplePack.days.length, samplePack.pack.day_count);
  samplePack.days.forEach((day, index) => {
    assert.equal(day.day_number, index + 1);
    assert.equal(new Set(day.items.map(item => item.id)).size, day.items.length);
    for (const item of day.items) {
      if (item.type === 'sentence_order') {
        assert.deepEqual(new Set(item.tokens.map(token => token.id)), new Set(item.display_order));
        assert.equal(new Set(item.display_order).size, item.display_order.length);
        for (const id of item.answer_order) assert.ok(item.display_order.includes(id));
      } else if (item.type === 'meaning_choice') {
        assert.ok(item.options.some(option => option.id === item.answer_option_id));
      } else if (item.type === 'situational_choice') {
        for (const id of item.answer_option_ids) assert.ok(item.options.some(option => option.id === id));
      } else assert.equal(item.graded, false);
    }
  });
});

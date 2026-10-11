import { samplePack as pack } from './sample.js';
import type { AnyItem, Day, SentenceOrderItem } from './types.js';
import { el, renderJa, type ReadingAid } from './render.js';
import { gradeMeaningChoice, gradeSentenceOrder, gradeSituationalChoice } from './grading.js';
import { beginPack, loadProgress, saveDay, resetPack, persistenceMode, type DayProgress } from './storage.js';
import { isUnlocked } from './unlock.js';

const root = document.querySelector<HTMLElement>('#app')!;
const packId = pack.pack.id;
let aid: ReadingAid = 'ruby';
let currentView: 'home' | 'practice' | 'complete' = 'home';
const now = () => new Date().toISOString();

function button(text: string, action: () => void, className = ''): HTMLButtonElement {
  const node = el('button', className, text);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}
function heading(text: string): void {
  const h = el('h2', '', text);
  h.tabIndex = -1;
  root.append(h);
  h.focus();
}
function privacyNote(): HTMLElement {
  return el('p', 'notice', persistenceMode(packId) === 'session'
    ? 'Session only: browser storage is unavailable or contains unreadable data. Progress may be lost on reload. Reset can clear unreadable data.'
    : 'Progress stays in this browser on this device. Keep the same local address and port. Clearing browser data removes it.');
}

function home(message = ''): void {
  currentView = 'home';
  const progress = beginPack(packId, now());
  root.replaceChildren();
  heading(pack.pack.title.en);
  root.append(el('p', '', pack.pack.description.en), privacyNote());
  if (message) { const notice = el('p', 'notice', message); notice.setAttribute('role', 'status'); root.append(notice); }
  const label = el('label', '', 'Reading aid ');
  const select = el('select');
  select.setAttribute('aria-label', 'Reading aid');
  for (const [value, text] of [['ruby', 'Furigana'], ['romaji', 'Romaji'], ['off', 'Japanese only']]) {
    const option = el('option', '', text); option.value = value!; select.append(option);
  }
  select.value = aid;
  select.addEventListener('change', () => { aid = select.value as ReadingAid; });
  label.append(select); root.append(label);
  const list = el('ol', 'days');
  for (const day of pack.days) {
    const open = isUnlocked(day.day_number, progress.startedAt, now(), pack.pack.day_count);
    const saved = progress.days[day.day_number];
    const row = el('li', 'day');
    row.append(el('h3', '', `Day ${day.day_number} · ${day.scenario.title.en}`));
    row.append(el('p', '', saved?.done ? `Complete · ${saved.correctCount}/${saved.gradedCount} · ${saved.selfRating ?? 'unrated'}` : 'About 3 minutes'));
    const start = button(`${saved?.done ? 'Replay' : 'Start'} day ${day.day_number}`, () => {
      const latest = loadProgress(packId) ?? beginPack(packId, now());
      if (isUnlocked(day.day_number, latest.startedAt, now(), pack.pack.day_count)) runDay(day);
      else home();
    }, 'primary');
    start.disabled = !open;
    row.append(start);
    if (!open) row.append(el('p', 'muted', 'Unlocks on the next local calendar day.'));
    list.append(row);
  }
  root.append(list);
  root.append(button('Reset demo progress', () => {
    const box = el('section', 'notice');
    box.append(el('p', '', 'Erase the saved progress for this demo?'));
    box.append(button('Yes, reset', () => {
      const removed = resetPack(packId);
      home(removed ? 'Demo progress reset.' : 'Reset for this session only. Browser removal failed; old data may return after reload. Clear this site’s data in browser settings to erase it.');
    }), button('Cancel', () => home()));
    root.append(box);
    box.querySelector('button')?.focus();
  }));
}

function runDay(day: Day): void {
  currentView = 'practice';
  const result: DayProgress = { done: true, correctCount: 0, gradedCount: 0, anyWrong: false };
  let index = 0;
  const next = (): void => { index += 1; show(); };
  function show(): void {
    root.replaceChildren();
    heading(`Day ${day.day_number} · ${day.scenario.title.en}`);
    const item = day.items[index];
    if (!item) {
      root.append(el('p', '', day.self_rating.prompt.en));
      for (const [rating, text] of [['easy', 'Easy'], ['appropriate', 'Just right'], ['difficult', 'Difficult']] as const) {
        root.append(button(text, () => finish(day, { ...result, selfRating: rating }), 'option'));
      }
    } else {
      root.append(el('p', 'muted', `Step ${index + 1} of ${day.items.length}`));
      renderItem(item);
    }
    root.append(button('Back to days', () => home('Unfinished attempts are not saved.'), 'quiet'));
  }
  function feedback(correct: boolean, explanation: string): void {
    result.gradedCount += 1;
    if (correct) result.correctCount += 1; else result.anyWrong = true;
    const status = el('p', correct ? 'feedback correct' : 'feedback', `${correct ? 'Correct.' : 'Try it again next time.'} ${explanation}`);
    status.setAttribute('role', 'status');
    root.append(status, button('Next', next, 'primary'));
    root.querySelector<HTMLButtonElement>('button.primary:last-child')?.focus();
  }
  function renderItem(item: AnyItem): void {
    if (item.type === 'produce_compare') {
      root.append(el('p', '', item.situation.en));
      const label = el('label', '', 'Your attempt (not saved)');
      const attempt = el('textarea'); attempt.rows = 3; attempt.maxLength = 1000; attempt.autocomplete = 'off';
      label.append(attempt); root.append(label, el('p', 'muted', item.note?.en ?? 'Ungraded.'));
      const reveal = button('Show model answer', () => {
        reveal.disabled = true;
        for (const answer of item.model_answers) { const line = el('p', 'stimulus'); line.append(renderJa(answer, aid)); root.append(line); }
        root.append(button('Continue', next, 'primary'));
      }, 'primary');
      root.append(reveal); return;
    }
    if (item.type === 'sentence_order') { renderOrder(item); return; }
    root.append(el('p', '', item.type === 'meaning_choice' ? item.prompt.en : item.situation.en));
    if (item.stimulus) { const line = el('p', 'stimulus'); line.append(renderJa(item.stimulus, aid)); root.append(line); }
    const choices: HTMLButtonElement[] = [];
    let answered = false;
    for (const option of item.options) {
      const choice = button('', () => {
        if (answered) return;
        answered = true;
        choices.forEach(node => { node.disabled = true; });
        const grade = item.type === 'meaning_choice' ? gradeMeaningChoice(item, option.id) : gradeSituationalChoice(item, option.id);
        feedback(grade.correct, item.explanation.en);
      }, 'option');
      if (option.ja) choice.append(renderJa(option.ja, aid));
      else choice.textContent = option.text?.en ?? '';
      root.append(choice); choices.push(choice);
    }
  }
  function renderOrder(item: SentenceOrderItem): void {
    root.append(el('p', '', item.prompt.en));
    const selected: string[] = [];
    const answer = el('div', 'answer'); answer.setAttribute('aria-label', 'Your sentence');
    const board = el('div', 'tokens');
    const tokens = new Map(item.tokens.map(token => [token.id, token]));
    const buttons = new Map<string, HTMLButtonElement>();
    let answered = false;
    const check = button('Check answer', () => {
      if (answered || selected.length === 0) return;
      answered = true; check.disabled = true;
      buttons.forEach(node => { node.disabled = true; });
      answer.querySelectorAll('button').forEach(node => { node.disabled = true; });
      feedback(gradeSentenceOrder(item, selected).correct, item.explanation.en);
    }, 'primary');
    const sync = (): void => {
      answer.replaceChildren();
      if (!selected.length) answer.append(el('span', 'muted', 'Your sentence will appear here.'));
      for (const id of selected) {
        const chip = button('', () => {
          if (answered) return;
          selected.splice(selected.indexOf(id), 1); buttons.get(id)!.disabled = false; sync();
        }, 'token');
        chip.append(renderJa(tokens.get(id)!.ja, aid)); answer.append(chip);
      }
      check.disabled = selected.length === 0;
    };
    for (const id of item.display_order) {
      const chip = button('', () => { if (!answered && !chip.disabled) { selected.push(id); chip.disabled = true; sync(); } }, 'token');
      chip.dataset.tokenId = id; chip.append(renderJa(tokens.get(id)!.ja, aid)); board.append(chip); buttons.set(id, chip);
    }
    sync(); root.append(answer, board, check);
  }
  show();
}
function finish(day: Day, result: DayProgress): void {
  saveDay(packId, day.day_number, result, now());
  currentView = 'complete';
  root.replaceChildren();
  heading(`Day ${day.day_number} complete`);
  root.append(el('p', 'score', `${result.correctCount}/${result.gradedCount} correct`));
  root.append(el('p', '', 'The written comparison is ungraded. Replay any unlocked day for practice.'), privacyNote());
  root.append(button('Back to days', () => home(), 'primary'));
}

// Refresh the home screen across midnight without interrupting an attempt.
setInterval(() => { if (currentView === 'home' && document.visibilityState === 'visible') refreshUnlocks(); }, 30_000);
function refreshUnlocks(): void {
  const progress = loadProgress(packId);
  if (!progress) return;
  const locked = root.querySelectorAll<HTMLButtonElement>('.day button:disabled');
  if (locked.length && isUnlocked(2, progress.startedAt, now(), pack.pack.day_count)) home();
}
document.addEventListener('visibilitychange', () => { if (currentView === 'home') refreshUnlocks(); });
home();

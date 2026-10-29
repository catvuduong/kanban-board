export const COLUMNS = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'In progress' },
  { id: 'done', title: 'Done' },
] as const;

export type ColumnId = (typeof COLUMNS)[number]['id'];

export type Card = {
  id: string;
  title: string;
  column: ColumnId;
};

export const STORAGE_KEY = 'kanban-board:cards';

const STARTER_CARDS: Card[] = [
  { id: 'starter-1', title: 'Sketch the board layout', column: 'done' },
  { id: 'starter-2', title: 'Persist cards in the browser', column: 'done' },
  { id: 'starter-3', title: 'Write e2e tests for every action', column: 'doing' },
  { id: 'starter-4', title: 'Review colours in dark mode', column: 'doing' },
  { id: 'starter-5', title: 'Add due dates to cards', column: 'todo' },
  { id: 'starter-6', title: 'Polish the mobile layout', column: 'todo' },
];

export function newCardId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** The column one step left or right of `column`, or null at the edges. */
export function neighbourColumn(column: ColumnId, direction: -1 | 1): ColumnId | null {
  const index = COLUMNS.findIndex(c => c.id === column) + direction;
  return COLUMNS[index]?.id ?? null;
}

function isColumnId(value: unknown): value is ColumnId {
  return COLUMNS.some(c => c.id === value);
}

function isCard(value: unknown): value is Card {
  if (typeof value !== 'object' || value === null) return false;
  const card = value as Record<string, unknown>;
  return typeof card.id === 'string' && typeof card.title === 'string' && isColumnId(card.column);
}

export function loadCards(): Card[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return STARTER_CARDS;
    const data: unknown = JSON.parse(raw);
    if (Array.isArray(data) && data.every(isCard)) return data;
  } catch {
    // Storage is blocked or holds invalid JSON: fall back to the starter board.
  }
  return STARTER_CARDS;
}

export function saveCards(cards: Card[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // Storage is blocked or full: the board still works for this visit.
  }
}

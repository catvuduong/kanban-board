'use client';

import { useState, useSyncExternalStore, type FormEvent } from 'react';
import {
  COLUMNS,
  loadCards,
  neighbourColumn,
  newCardId,
  saveCards,
  type Card,
  type ColumnId,
} from '@/lib/board';

const noopSubscribe = () => () => {};

// Storage only exists in the browser, so the board renders after hydration.
// The server and first client render both emit just the heading, so they match.
export function KanbanBoard() {
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  if (!ready) {
    return (
      <main className="board">
        <h1>Kanban Board</h1>
      </main>
    );
  }

  return <Board />;
}

function Board() {
  const [cards, setCards] = useState<Card[]>(loadCards);

  function updateCards(next: Card[]) {
    setCards(next);
    saveCards(next);
  }

  function addCard(column: ColumnId, title: string) {
    updateCards([...cards, { id: newCardId(), title, column }]);
  }

  function moveCard(id: string, direction: -1 | 1) {
    updateCards(
      cards.map(card => {
        if (card.id !== id) return card;
        const column = neighbourColumn(card.column, direction);
        return column ? { ...card, column } : card;
      }),
    );
  }

  function deleteCard(id: string) {
    updateCards(cards.filter(card => card.id !== id));
  }

  return (
    <main className="board">
      <header className="board-header">
        <h1>Kanban Board</h1>
        <p className="board-note">
          {cards.length} {cards.length === 1 ? 'card' : 'cards'} · saved in this browser
        </p>
      </header>

      <div className="columns">
        {COLUMNS.map(column => {
          const columnCards = cards.filter(card => card.column === column.id);
          return (
            <section key={column.id} className="column" data-testid={`column-${column.id}`}>
              <div className="column-header">
                <h2>{column.title}</h2>
                <span className="column-count" data-testid={`count-${column.id}`}>
                  {columnCards.length}
                </span>
              </div>

              <ul className="card-list">
                {columnCards.map(card => (
                  <li key={card.id} className="card" data-testid="card">
                    <span className="card-title" data-testid="card-title">
                      {card.title}
                    </span>
                    <div className="card-actions">
                      <button
                        type="button"
                        aria-label="Move left"
                        title="Move left"
                        onClick={() => moveCard(card.id, -1)}
                        disabled={neighbourColumn(card.column, -1) === null}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        aria-label="Move right"
                        title="Move right"
                        onClick={() => moveCard(card.id, 1)}
                        disabled={neighbourColumn(card.column, 1) === null}
                      >
                        →
                      </button>
                      <button
                        type="button"
                        aria-label="Delete card"
                        title="Delete card"
                        className="delete"
                        onClick={() => deleteCard(card.id)}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {columnCards.length === 0 && <p className="empty">No cards yet</p>}

              <AddCardForm column={column.id} onAdd={addCard} />
            </section>
          );
        })}
      </div>
    </main>
  );
}

function AddCardForm({
  column,
  onAdd,
}: {
  column: ColumnId;
  onAdd: (column: ColumnId, title: string) => void;
}) {
  const [title, setTitle] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(column, trimmed);
    setTitle('');
  }

  return (
    <form className="add-card" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Add a card"
        aria-label={`New card in ${column}`}
        value={title}
        onChange={event => setTitle(event.target.value)}
        data-testid={`new-card-input-${column}`}
      />
      <button type="submit" data-testid={`add-card-${column}`}>
        Add
      </button>
    </form>
  );
}

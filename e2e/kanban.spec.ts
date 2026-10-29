import { test, expect, type Page } from '@playwright/test';

const STORAGE_KEY = 'kanban-board:cards';

function column(page: Page, id: 'todo' | 'doing' | 'done') {
  return page.getByTestId(`column-${id}`);
}

function card(page: Page, id: 'todo' | 'doing' | 'done', title: string) {
  return column(page, id).getByTestId('card').filter({ hasText: title });
}

async function addCard(page: Page, id: 'todo' | 'doing' | 'done', title: string) {
  await page.getByTestId(`new-card-input-${id}`).fill(title);
  await page.getByTestId(`add-card-${id}`).click();
}

test('shows the starter board with cards and counts in each column', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Kanban Board' })).toBeVisible();
  await expect(column(page, 'todo').getByRole('heading', { name: 'To do' })).toBeVisible();
  await expect(column(page, 'doing').getByRole('heading', { name: 'In progress' })).toBeVisible();
  await expect(column(page, 'done').getByRole('heading', { name: 'Done' })).toBeVisible();

  await expect(page.getByTestId('count-todo')).toHaveText('2');
  await expect(page.getByTestId('count-doing')).toHaveText('2');
  await expect(page.getByTestId('count-done')).toHaveText('2');
  await expect(card(page, 'todo', 'Add due dates to cards')).toBeVisible();
});

test('adds a card to a column and keeps it after reload', async ({ page }) => {
  await page.goto('/');

  await addCard(page, 'doing', 'Ship the release');
  await expect(card(page, 'doing', 'Ship the release')).toBeVisible();
  await expect(page.getByTestId('new-card-input-doing')).toHaveValue('');
  await expect(page.getByTestId('count-doing')).toHaveText('3');

  await page.reload();
  await expect(card(page, 'doing', 'Ship the release')).toBeVisible();
  await expect(page.getByTestId('count-doing')).toHaveText('3');
});

test('ignores a blank card title', async ({ page }) => {
  await page.goto('/');

  await addCard(page, 'todo', '   ');

  await expect(page.getByTestId('count-todo')).toHaveText('2');
});

test('moves a card right and left between columns and keeps it after reload', async ({ page }) => {
  await page.goto('/');
  const target = card(page, 'todo', 'Add due dates to cards');

  await target.getByRole('button', { name: 'Move right' }).click();
  await expect(card(page, 'doing', 'Add due dates to cards')).toBeVisible();
  await expect(page.getByTestId('count-todo')).toHaveText('1');
  await expect(page.getByTestId('count-doing')).toHaveText('3');

  await card(page, 'doing', 'Add due dates to cards')
    .getByRole('button', { name: 'Move right' })
    .click();
  await expect(card(page, 'done', 'Add due dates to cards')).toBeVisible();

  await page.reload();
  await expect(card(page, 'done', 'Add due dates to cards')).toBeVisible();

  await card(page, 'done', 'Add due dates to cards')
    .getByRole('button', { name: 'Move left' })
    .click();
  await expect(card(page, 'doing', 'Add due dates to cards')).toBeVisible();
  await expect(page.getByTestId('count-done')).toHaveText('2');
});

test('disables move buttons at the first and last column', async ({ page }) => {
  await page.goto('/');

  const first = card(page, 'todo', 'Add due dates to cards');
  await expect(first.getByRole('button', { name: 'Move left' })).toBeDisabled();
  await expect(first.getByRole('button', { name: 'Move right' })).toBeEnabled();

  const last = card(page, 'done', 'Sketch the board layout');
  await expect(last.getByRole('button', { name: 'Move right' })).toBeDisabled();
  await expect(last.getByRole('button', { name: 'Move left' })).toBeEnabled();
});

test('deletes a card and it stays deleted after reload', async ({ page }) => {
  await page.goto('/');

  await card(page, 'doing', 'Review colours in dark mode')
    .getByRole('button', { name: 'Delete card' })
    .click();
  await expect(card(page, 'doing', 'Review colours in dark mode')).toHaveCount(0);
  await expect(page.getByTestId('count-doing')).toHaveText('1');

  await page.reload();
  await expect(card(page, 'doing', 'Review colours in dark mode')).toHaveCount(0);
  await expect(page.getByTestId('count-doing')).toHaveText('1');
});

test('shows an empty state when a column has no cards', async ({ page }) => {
  await page.goto('/');

  const deleteButtons = column(page, 'todo').getByRole('button', { name: 'Delete card' });
  await deleteButtons.first().click();
  await deleteButtons.first().click();

  await expect(page.getByTestId('count-todo')).toHaveText('0');
  await expect(column(page, 'todo').getByText('No cards yet')).toBeVisible();
});

test('falls back to the starter board when saved data is invalid', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(
    key => window.localStorage.setItem(key, '[{"id":"x","title":"broken","column":"nowhere"}]'),
    STORAGE_KEY,
  );

  await page.reload();

  await expect(page.getByTestId('count-todo')).toHaveText('2');
  await expect(page.getByTestId('count-doing')).toHaveText('2');
  await expect(page.getByTestId('count-done')).toHaveText('2');
});

test('fits a phone-width screen without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto('/');
  await expect(column(page, 'done')).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

import { expect } from 'e2e';
import { test } from './duo.ts';

test('launches closed and opens into two panes', async ({ app, screen, fold }) => {
  await app.open();
  await expect(screen.getByRole('button', 'Pioneers')).toBeSelected();
  await expect(screen.getByRole('button', 'go down')).toHaveCount(0);

  await fold('half-open');
  await expect(screen.getByRole('button', 'go down')).toBeVisible();
  await expect(screen.getByText('Theory of computation · British · 1912–1954')).toBeVisible();
});

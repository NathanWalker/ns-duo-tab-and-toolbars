import { expect } from 'e2e';
import { test } from './duo.ts';

test('unfolding splits list and detail across the hinge', async ({ app, agent, screen, fold }) => {
  await app.open();
  await expect(screen.getByRole('button', 'go down')).toHaveCount(0);

  await fold('half-open');
  await expect(screen.getByText('Theory of computation · British · 1912–1954')).toBeVisible();
  await agent.assert(
    'the screen is split in two, with the list of pioneers on one side and Alan Turing’s detail page with a toolbar on the other',
    { vision: true },
  );

  await agent.act('show Ada Lovelace in the detail pane');
  await expect(screen.getByText('The first program · British · 1815–1852')).toBeVisible();

  await fold('closed');
  await expect(screen.getByRole('button', 'go down')).toHaveCount(0);
  await agent.assert('the pioneers list fills the screen and no detail page is showing');
});

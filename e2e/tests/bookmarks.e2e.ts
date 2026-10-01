import { expect } from 'e2e';
import { test } from './duo.ts';

test('a bookmark from the toolbar shows up in Bookmarks', async ({ app, agent, screen }) => {
  await app.open();

  await agent.act('bookmark Donald Knuth using the toolbar on his page');
  await screen.getByTestId('BackButton').tap();
  await screen.getByRole('button', 'Bookmarks').tap();
  await expect(screen.getByText('Donald Knuth')).toBeVisible();
  await expect(screen.getByRole('listitem')).toHaveCount(4);
});

import { expect } from 'e2e';
import { test } from './duo.ts';

test('search narrows the pioneers by field', async ({ app, agent, screen }) => {
  await app.open();

  await agent.act('search for {query}', { params: { query: 'compiler' } });
  await expect(screen.getByText('Grace Hopper')).toBeVisible();
  await expect(screen.getByText('Alan Turing')).toHaveCount(0);
});

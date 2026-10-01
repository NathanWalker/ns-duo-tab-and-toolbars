import { expect } from 'e2e';
import { test } from './duo.ts';

test('opens a pioneer and pages through them with the native toolbar', async ({ app, agent, screen }) => {
  await app.open();

  await agent.act('open Grace Hopper');
  await expect(screen.getByText('Compilers and languages · American · 1906–1992')).toBeVisible();

  await screen.getByRole('button', 'go down').tap();
  await expect(screen.getByText('Algorithms · American · b. 1938')).toBeVisible();
  await agent.assert('the page is about Donald Knuth and lists his notable work');
});

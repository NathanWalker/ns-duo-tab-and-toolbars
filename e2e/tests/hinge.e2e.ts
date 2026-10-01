import { expect } from 'e2e';
import { z } from 'zod';
import { test } from './duo.ts';

test('the Hinge tab reads the live hinge angle from UIKit', async ({ app, agent, screen, fold }) => {
  await app.open();
  await fold('half-open');

  await screen.getByRole('button', 'Hinge').tap();
  const hinge = await agent.extract('the hinge pose and its angle in degrees', {
    schema: z.object({ pose: z.string(), degrees: z.number() }),
  });
  expect(hinge.degrees).toBeGreaterThan(100);
  expect(hinge.degrees).toBeLessThan(160);
});

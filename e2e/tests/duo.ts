import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { test as base } from '@e2e-dev/mobile';

const exec = promisify(execFile);

export type Pose = 'closed' | 'half-open' | 'open';

// The mobile engine names its agent-device session `e2e-<target>-<slot>`; with
// one worker that is slot 0. Folding inside that session keeps its snapshots in step.
const session = process.env.E2E_SESSION ?? 'e2e-duo-0';

let installed = false;

export const test = base
  .extend<{ build: void }>({
    // The engine installs nothing itself: put the current build on the simulator once per run.
    build: async ({ device }, use) => {
      if (!installed) {
        await device.installApp();
        installed = true;
      }
      await use();
    },
  })
  .extend<{ fold: (pose: Pose) => Promise<void> }>({
    /**
     * `@e2e-dev/mobile` has no hinge control yet, so this calls agent-device's
     * `fold`, which sends the simulator's HID hinge event and waits until
     * CoreDevice reports the new angle (10–16 s per pose change). Tests start
     * closed, so a test that folds is unfolded back afterwards.
     */
    fold: async (_, use) => {
      let pose: Pose = 'closed';
      await use(async (next) => {
        await exec('npx', ['agent-device', 'fold', next, '--session', session]);
        pose = next;
      });
      if (pose !== 'closed') await exec('npx', ['agent-device', 'fold', 'closed', '--session', session]);
    },
  });

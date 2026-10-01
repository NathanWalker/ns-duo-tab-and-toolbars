import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { E2EConfig } from 'e2e';
import { mobile } from '@e2e-dev/mobile';
import { mobileTools } from '@e2e-dev/mobile/tools';
import { anthropic } from '@ai-sdk/anthropic';

// e2e loads no .env on its own; ANTHROPIC_API_KEY can live in e2e/.env (gitignored).
const envFile = fileURLToPath(new URL('.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

// Claude 5.x rejects forced tool use; the AI SDK falls back to 'auto' and warns on every step.
(globalThis as { AI_SDK_LOG_WARNINGS?: boolean }).AI_SDK_LOG_WARNINGS = false;

const duo = mobile({ platform: 'ios', device: process.env.E2E_DEVICE ?? 'iPhone Duo' });

export default {
  agents: {
    default: {
      model: anthropic(process.env.E2E_MODEL ?? 'claude-sonnet-5-5'),
      system: 'You are a thorough QA agent testing a native iOS app on iPhone Duo, a foldable iPhone. Verify every outcome on screen.',
      context:
        'The tab bar is a vertical bar on the trailing edge of the screen with four tabs: Pioneers, Bookmarks, Hinge and Search. ' +
        'Pioneers lists computing pioneers; tapping one opens their detail page with a native toolbar at the bottom ' +
        '(previous, next, bookmark, share and a more menu).',
      tools: mobileTools(duo),
    },
  },
  targets: [
    {
      name: 'duo',
      engine: duo,
      app: {
        bundleId: 'org.nativescript.nsduotabandtoolbars',
        appPath: fileURLToPath(new URL('../platforms/ios/build/Debug-iphonesimulator/nsduotabandtoolbars.app', import.meta.url)),
      },
    },
  ],
  workers: 1,
} satisfies E2EConfig;

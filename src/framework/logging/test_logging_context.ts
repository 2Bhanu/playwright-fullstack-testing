import { AsyncLocalStorage } from 'node:async_hooks';

export interface TestLogContext {
  logs: string[];
}

export const testLogContext =
  new AsyncLocalStorage<TestLogContext>();
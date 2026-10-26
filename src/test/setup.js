import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { configureSimulation, resetCluster } from '../distributed/cluster';
import { resetInventory } from '../distributed/inventory';

// No network delay and no random failures: tests inject failures explicitly.
configureSimulation({ latencyScale: 0, failureRate: 0, random: () => 0.5 });

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  resetCluster();
  resetInventory();
});

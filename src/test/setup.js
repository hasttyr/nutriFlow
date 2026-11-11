import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { configureSimulation, resetCluster } from '../distributed/cluster';
import { resetInventory } from '../distributed/inventory';
import { resetRegion } from '../geo/region';
import { resetLive } from '../live/store';

// No network delay and no random failures: tests inject failures explicitly.
configureSimulation({ latencyScale: 0, failureRate: 0, random: () => 0.5 });

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetLive();
  resetCluster();
  resetInventory();
  resetRegion();
});

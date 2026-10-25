let lastCheck = Date.now();
let currentLag = 0;
let monitorInterval: NodeJS.Timeout | null = null;

export function startEventLoopMonitor(intervalMs = 100): void {
  if (monitorInterval) return;

  lastCheck = Date.now();
  monitorInterval = setInterval(() => {
    const now = Date.now();
    const delta = now - lastCheck - intervalMs;
    currentLag = Math.max(0, delta);
    lastCheck = now;
  }, intervalMs);

  monitorInterval.unref();
}

export function stopEventLoopMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

export function getEventLoopLag(): number {
  return currentLag;
}

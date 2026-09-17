const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || (import.meta.env.PROD ? '' : 'http://localhost:4000');

export async function startPull(): Promise<{ id: string; status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/pull/start`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to start pull (${res.status})`);
  }
  const run = await res.json();
  
  // Kick off the background chunk loop, but don't await it here so the UI unblocks
  syncPullLoop(run.id).catch(console.error);
  
  return run;
}

export async function syncPullLoop(pullRunId: string) {
  let isRunning = true;
  while (isRunning) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/pull/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pullRunId }),
      });
      if (!res.ok) {
        console.error('Failed to process chunk step:', res.statusText);
        break;
      }
      
      // Check status to see if we should continue
      const statusRes = await fetch(`${API_BASE_URL}/api/pull/status`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (!statusData || statusData.status !== 'running') {
          isRunning = false;
        }
      } else {
        isRunning = false;
      }
    } catch (err) {
      console.error('Chunk step failed:', err);
      break;
    }
  }
}

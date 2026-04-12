import { IJobQueue } from '../../ports/job-queue';
import { BullMQAdapter } from './bullmq-adapter';
import { MemoryQueueAdapter } from './memory-adapter';

export type QueueMode = 'memory' | 'bullmq';

let _instance: IJobQueue | null = null;
let _instanceMode: string | null = null;

export async function createJobQueue(mode?: QueueMode): Promise<IJobQueue> {
  const resolvedMode = mode || (process.env.QUEUE_MODE as QueueMode) || 'memory';

  if (resolvedMode === 'bullmq') {
    return new BullMQAdapter();
  }

  // Default to memory adapter
  return new MemoryQueueAdapter();
}

/**
 * Singleton accessor for the job queue.
 */
export function getJobQueue(): IJobQueue {
  const currentMode = process.env.QUEUE_MODE || 'memory';
  
  // Reset singleton if mode changed
  if (_instance && _instanceMode !== currentMode) {
    _instance = null;
  }
  
  if (!_instance) {
    // Synchronous initialization
    const mode = currentMode as QueueMode;
    if (mode === 'bullmq') {
      _instance = new BullMQAdapter();
    } else {
      _instance = new MemoryQueueAdapter();
    }
    _instanceMode = currentMode;
  }
  
  return _instance;
}

export type { IJobQueue } from '../../ports/job-queue';

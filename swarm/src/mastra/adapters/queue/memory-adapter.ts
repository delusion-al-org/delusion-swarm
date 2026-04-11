import { IJobQueue, JobPayload, JobResult } from '../../ports/job-queue';

export class MemoryQueueAdapter implements IJobQueue {
  private queue: Array<{ jobId: string; payload: JobPayload }> = [];
  private isProcessing = false;
  private handler?: (jobId: string, payload: JobPayload) => Promise<any>;

  async enqueue(jobId: string, payload: JobPayload): Promise<JobResult> {
    this.queue.push({ jobId, payload });
    console.log(`[MemoryQueue] Enqueued job: ${jobId}`);
    
    // Fire and forget processing loop
    if (!this.isProcessing) {
      this.processNext().catch(e => console.error('[MemoryQueue] processing error:', e));
    }

    return {
      jobId,
      status: 'queued',
    };
  }

  initWorker(handler: (jobId: string, payload: JobPayload) => Promise<any>): void {
    this.handler = handler;
    console.log('[MemoryQueue] Worker initialized');
  }

  private async processNext(): Promise<void> {
    if (this.queue.length === 0 || !this.handler) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { jobId, payload } = this.queue.shift()!;
    
    try {
      console.log(`[MemoryQueue] Processing job: ${jobId}...`);
      await this.handler(jobId, payload);
      console.log(`[MemoryQueue] Finished job: ${jobId}`);
    } catch (error: any) {
      console.error(`[MemoryQueue] Failed job: ${jobId}`, error);
    }

    // Process next recursively
    await this.processNext();
  }
}

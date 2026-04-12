import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { IJobQueue, JobPayload, JobResult } from '../../ports/job-queue';

export class BullMQAdapter implements IJobQueue {
  private queue: Queue;
  private worker?: Worker;

  constructor(redisUrl?: string) {
    const defaultUrl = 'redis://localhost:6379';
    const connection = new Redis(redisUrl || process.env.REDIS_URL || defaultUrl, {
      maxRetriesPerRequest: null,
    });
    
    this.queue = new Queue('delusion-swarm-jobs', { connection });
    console.log(`[BullMQAdapter] Connected to queue at ${connection.options.host}:${connection.options.port}`);
  }

  async enqueue(jobId: string, payload: JobPayload): Promise<JobResult> {
    try {
      const job = await this.queue.add('agent-task', payload, {
        jobId,
        removeOnComplete: true, // Keep it clean for long-running workflows
        removeOnFail: 100, // Keep last 100 failed jobs for debugging
      });

      return {
        jobId: job.id!,
        status: 'queued',
      };
    } catch (e: any) {
      console.error(`[BullMQAdapter] failed to enqueue job:`, e);
      return {
        jobId,
        status: 'failed',
        error: e.message,
      };
    }
  }

  initWorker(handler: (jobId: string, payload: JobPayload) => Promise<any>): void {
    if (this.worker) return; // Prevent double init
    
    const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });

    this.worker = new Worker('delusion-swarm-jobs', async (job) => {
      console.log(`[BullMQ Worker] Picked up job ${job.id}`);
      await handler(job.id || 'unknown', job.data as JobPayload);
      console.log(`[BullMQ Worker] Completed job ${job.id}`);
    }, { connection });

    this.worker.on('failed', (job, err) => {
      console.error(`[BullMQ Worker] Job ${job?.id} failed with error:`, err);
    });

    console.log('[BullMQAdapter] Worker initialized and waiting for jobs...');
  }
}

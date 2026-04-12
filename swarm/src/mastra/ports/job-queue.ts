export interface JobPayload {
  agentRole: string;
  messages: any[];
  metadata?: Record<string, any>;
}

export interface JobResult {
  jobId: string;
  status: 'queued' | 'active' | 'completed' | 'failed';
  error?: string;
}

export interface IJobQueue {
  /**
   * Pushes a new heavy task to the background queue.
   */
  enqueue(jobId: string, payload: JobPayload): Promise<JobResult>;
  
  /**
   * Initializes the background worker to consume jobs.
   * The handler function contains the logic to execute the agent.
   */
  initWorker(handler: (jobId: string, payload: JobPayload) => Promise<any>): void;
}

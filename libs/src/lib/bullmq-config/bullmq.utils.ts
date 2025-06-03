// Types and constants for BullMQ configuration
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';

/**
 * Create a Bull Board for queue monitoring
 * @param queues Array of BullMQ queues to monitor
 * @returns Express middleware for Bull Board
 */
export function createBullBoardMiddleware(queues: Queue[] = []) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const bullBoardQueues = queues.map((queue) => new BullMQAdapter(queue));

  createBullBoard({
    queues: bullBoardQueues,
    serverAdapter,
  });

  return serverAdapter.getRouter();
}

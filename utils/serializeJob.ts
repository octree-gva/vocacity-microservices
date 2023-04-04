import type {Job} from 'bullmq'
import { create404 } from './createError'
const serializeJob = async (job: Job) => {
  if(!job){
    return create404()
  }
  const status = await job.getState();
  const {serviceName="unknown"} = job.data.meta || {};
  return {
    id: job.id,
    action: `${serviceName}.${job.name}`,
    queue: job?.queueName,
    status: status,
    data: (job.data || {}).params,
    failedReason: job.failedReason,
    progress: job.progress,
    returnvalue: job.returnvalue,
    attemptsMade: job.attemptsMade,
    delay: job.delay,
    timestamp: job.timestamp,
  }
}
export default serializeJob
import type {Job} from 'bullmq'
const serializeJob = (job: Job) => {
  return {
    id: job.id,
    service: job.name,
    progress: job.progress,
    returnvalue: job.returnvalue,
    attemptsMade: job.attemptsMade,
    delay: job.delay,
    timestamp: job.timestamp,
  }
}
export default serializeJob
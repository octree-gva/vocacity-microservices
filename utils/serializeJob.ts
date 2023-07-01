import type { Job } from "bullmq";
import { SerializedJob } from "../types";

const serializeJob = async (job: Job) => {
  if (!job) {
    throw new Error("No job to serialize");
  }
  const status = await job.getState();
  const { serviceName = "unknown" } = job.data.meta || {};
  return {
    id: job.id,
    action: `${serviceName}.${job.name}`,
    queue: job?.queueName,
    status,
    data: (job.data || {}).params,
    failedReason: job.failedReason,
    progress: job.progress,
    returnvalue: job.returnvalue,
    attemptsMade: job.attemptsMade,
    delay: job.delay,
    timestamp: job.timestamp,
  } as SerializedJob;
};
export default serializeJob;

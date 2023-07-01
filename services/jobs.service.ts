import type { Job } from "bullmq";
import _ from "lodash";
import BullMqMixin from "moleculer-bullmq";
import type { SerializedJob, ServiceDefinition } from "../types";
import { ParkAction, VaultSetAction } from "../types";
import { create400, create404, createGraphql404, createSuccess } from "../utils/createResponse";
import serializeJob from "../utils/serializeJob";

/**
 * Provides observability on jobs.
 *
 */
const JobsService: ServiceDefinition<
  {
    status: {
      params: { name: string; id: Job["id"] };
      returns: SerializedJob;
    };
  },
  [typeof BullMqMixin]
> = {
  name: "jobs",
  settings: {
    bullmq: {
      client: process.env.BULL_REDIS_URL,
      worker: { concurrency: 1 },
    },
    settings: {
      graphql: {
        type: `
				"""
					Serialized Asyncronus Job
				"""
				type Job_Data {
					timestamp: Int!
					action: String!
					queue: String!
					status: String!
					data: Object!
					failedReason: String!
					progress: Int!
					returnvalue: Object,
					attemptsMade: Int!
					delay: Int!
					timestamp: Int!
				}
				`,
      },
    },
  },
  mixins: [BullMqMixin],
  actions: {
    // TODO endpoint to list jobs for an organization
    status: {
      params: {
        id: "number",
        name: "string",
      },
      graphql: {
        query: `
                  """
                    Get Information about a job
                  """
                  status(id: ID!, jobName: String!): Job_Data
                `,
      },
      async handler(ctx) {
        const job = await this.job(ctx.params.name, ctx.params.id);
        if (job.data?.aud && !(ctx.meta.permissions || []).includes(job.data?.aud)) {
          return create404();
        }
        return createSuccess(await serializeJob(job));
      },
    },
  },
};
export default JobsService;

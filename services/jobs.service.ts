import {
	ServiceDefinition,
	ParkAction,VaultSetAction
} from "../types";
import {
	create400,
	createSuccess,
} from "../utils/createResponse";
import type {Job} from 'bullmq'
import BullMqMixin from 'moleculer-bullmq'
import _ from 'lodash'
import serializeJob from "../utils/serializeJob";

/**
 * Park instances from an infrastructure chart. 
 * This service is accountable to: 
 * - ask vault to save secrets (vault.set)
 * - insert vault's secrets in the infrastructure chart
 * - deploy the chart
 * - dispatch when an environment is parked.
 * 
 * A park is an instance that is linked to no Organisation (for now).
 * 
 */
const JobsService: ServiceDefinition<{
  status: {name: string, id: Job["id"]};
}> = {
	name: "jobs",
    settings: {
    bullmq: {
      client: process.env.BULL_REDIS_URL,
      worker: { concurrency: 1 },
    }
  },
  mixins: [BullMqMixin],
	actions: {
    "status": {
      async handler(ctx){
        const job = await (this as any).job(ctx.params.name, ctx.params.id)
        return createSuccess(await serializeJob(job))
      }
    },
  },
};
export default JobsService;

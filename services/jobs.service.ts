import type { Job } from "bullmq";
import _ from "lodash";
import BullMqMixin from "moleculer-bullmq";
import type { ServiceDefinition } from "../types";
import { ParkAction, VaultSetAction } from "../types";
import { create400, createSuccess } from "../utils/createResponse";
import serializeJob from "../utils/serializeJob";

/**
 * Provides observability on jobs.
 *
 */
const JobsService: ServiceDefinition<{
	status: { name: string; id: Job["id"] };
}> = {
	name: "jobs",
	settings: {
		bullmq: {
			client: process.env.BULL_REDIS_URL,
			worker: { concurrency: 1 },
		},
	},
	mixins: [BullMqMixin],
	actions: {
		status: {
			async handler(ctx) {
				const job = await (this as any).job(ctx.params.name, ctx.params.id);
				return createSuccess(await serializeJob(job));
			},
		},
	},
};
export default JobsService;

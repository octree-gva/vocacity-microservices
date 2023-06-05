import type { Job } from "bullmq";
import _ from "lodash";
import BullMqMixin from "moleculer-bullmq";
import type { SerializedJob, ServiceDefinition } from "../types";
import { ParkAction, VaultSetAction } from "../types";
import { create400, createSuccess } from "../utils/createResponse";
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
	},
	mixins: [BullMqMixin],
	actions: {
		status: {
			params: {
				id: "number",
				name: "string",
			},
			async handler(ctx) {
				const job = await this.job(ctx.params.name, ctx.params.id);
				return createSuccess(await serializeJob(job));
			},
		},
	},
};
export default JobsService;

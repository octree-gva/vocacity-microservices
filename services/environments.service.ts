import { ServiceDefinition, InspectAction, SetLabelsAction } from "../types";
import { create400, createSuccess } from "../utils/createResponse";
import type { Job } from "bullmq";
import BullMqMixin from "moleculer-bullmq";
import _ from "lodash";
import jelastic from "../utils/jelastic";
import serializeJob from "../utils/serializeJob";
import { compileChart, random } from "../utils/deployments";

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
const EnvironmentService: ServiceDefinition<{
	inspect: InspectAction;
    setLabels: SetLabelsAction;
}> = {
	name: "environment",
	settings: {
		bullmq: {
			client: process.env.BULL_REDIS_URL,
		},
	},
	mixins: [BullMqMixin],
	actions: {
        setLabels: {
            params: {
                envName: "string",
                labels: "object"
            },
            async handler(ctx) {
                return createSuccess()
            }
        },
		inspect: {
			params: {},
			async handler(ctx) {
				const environments = await jelastic.inspect();
				return createSuccess({data: environments});
			},
		},
	},
};
export default EnvironmentService;

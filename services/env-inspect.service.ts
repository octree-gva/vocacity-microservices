import _ from "lodash";
import type { EnvironmentStatus, ServiceDefinition } from "../types";
import { create400, createSuccess } from "../utils/createResponse";
import jelastic from "../utils/jelastic";

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
const EnvInspectService: ServiceDefinition<{
	summary: EnvironmentStatus;
	details: EnvironmentStatus;
}> = {
	name: "env-inspect",
	settings: {},
	actions: {
		details: {
			params: {},
			async handler() {
				try {
					const environments = await jelastic.environmentsDetails();
					return createSuccess({ data: environments });
				} catch (e) {
					const { message } = e;
					if (`${message}`.startsWith("errors.")) {
						return create400(message);
					}
					return create400();
				}
			},
		},
		summary: {
			params: {},
			async handler() {
				try {
					const environments = await jelastic.environmentsInfo();
					return createSuccess({ data: environments });
				} catch (e) {
					const { message } = e;
					if (`${message}`.startsWith("errors.")) {
						return create400(message);
					}
					return create400();
				}
			},
		},
	},
};
export default EnvInspectService;

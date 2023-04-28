import type { Job } from "bullmq";
import _ from "lodash";
import BullMqMixin from "moleculer-bullmq";
import type { RoutingAction, RoutingTokenAction, ServiceDefinition } from "../types";
import { VaultSetAction } from "../types";
import { create400, createSuccess } from "../utils/createResponse";
import { compileChart, random } from "../utils/deployments";
import jelastic from "../utils/jelastic";
import type { EnvironmentsDetails } from "../utils/jelastic/environment/environmentsDetails";
import { parse, sign } from "../utils/jwt";
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
const DNSService: ServiceDefinition<{
	routing: RoutingAction;
	newToken: RoutingTokenAction;
}> = {
	name: "dns",

	actions: {
		/**
		 * Generate a new token for traefik with a validity of one year.
		 * You are forced to change this credentials every year.
		 */
		newToken: {
			params: {},
			async handler() {
				const token = sign("dns.service", ["dns.services"], undefined, "dns", 525949);
				return createSuccess({ token });
			},
		},
		/**
		 * HTTP endpoint, will:
		 * - check all properties of env.
		 * - get all the traefik.* properties
		 * - will post the configuration back to traefik.
		 */
		routing: {
			params: { token: "string" },
			async handler(ctx) {
				const { token } = ctx.params;
				const parsedToken = parse(token);
				ctx.meta.$responseType = "application/json";
				if (!parsedToken.active) {
					ctx.meta.$statusCode = "401";
					return create400("errors.dns.bad_token");
				}
				const { data: environments } = await ctx.call<{ data: EnvironmentsDetails[] }>(
					"env-inspect.details",
				);
				const traefikConfig = environments.reduce((acc, env) => {
					const { properties: props } = env;
					return Object.keys(props).reduce((acc, curr) => {
						_.set(acc, curr, props[curr]);
						return acc;
					}, {} as any);
				}, {} as any);
				return createSuccess({ config: traefikConfig.traefik });
			},
		},
	},
};
export default DNSService;

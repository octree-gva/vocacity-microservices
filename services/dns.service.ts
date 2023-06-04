import axios from "axios";
import _, { property } from "lodash";
import type { RoutingAction, RoutingTokenAction, ServiceDefinition } from "../types";
import { create400, createSuccess } from "../utils/createResponse";
import type { EnvironmentsDetails } from "../utils/jelastic/environment/environmentsDetails";
import { parse, sign } from "../utils/jwt";

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
					return _.merge(acc, jelasticToTraefik(env));
				}, {} as any);

				console.log("update config", { traefikConfig });

				return createSuccess({ config: traefikConfig });
			},
		},
	},
};
export default DNSService;

/**
 * Convert a jelastic environment introspection to a traefik configuration.
 * We uses environment properties to be able to set properties like docker labels.
 *
 * Here a minimal config, to set through properties (see env-labels.service):
 * traefik.enabled=true
 * traefik.http.routers.redis.rule=Host(`yourdomain.com`)
 * traefik.http.services.redis.loadbalancer.server.url=123.42.12.21
 */
const jelasticToTraefik = (env: EnvironmentsDetails) => {
	const { properties } = env;
	// Convert dotted notation in deepHash
	const props = Object.keys(properties).reduce((acc, curr) => {
		_.set(acc, curr, properties[curr]);
		return acc;
	}, {});
	const envName = _.get(env, "envName");
	if (!envName) {
		console.error("internal error: introspection gives an empty envName");
		return {};
	}
	if (!_.get(props, "traefik.enabled", false)) {
		return {};
	}
	const routerOptions = _.get(props, "traefik.http.routers", {});
	return Object.entries(routerOptions).reduce((acc, [currKey, routerConfig]) => {
		const routerName = `router-${envName}-${currKey}`;
		const serviceName = `service-${envName}-${currKey}`;
		const serviceConfig = _.get(props, `traefik.http.services.${currKey}`, {});
		const servers = [
			_.get(props, `traefik.http.services.${currKey}.loadbalancer.server`, undefined),
			..._.get(props, `traefik.http.services.${currKey}.loadbalancer.servers`, []),
		].filter(Boolean);
		return {
			[`${routerName}`]: _.merge(routerConfig, {
				service: serviceName,
				priority: _.get(routerOptions, "priority", 10),
				tls: _.get(routerOptions, "tls", { certResolver: "letsencrypt" }),
			}),
			[`${serviceName}`]: _.merge(serviceConfig, {
				loadbalancer: { servers },
			}),
		};
	}, {});
};

import { EnvironmentsDetails } from "../../utils/jelastic/environment/environmentsDetails";
import _ from "lodash";
/**
 * Convert a jelastic environment introspection to a traefik configuration.
 * We uses environment properties to be able to set properties like docker labels.
 *
 * Here a minimal config, to set through properties (see env-labels.service):
 * traefik.enabled=true
 * traefik.http.routers.redis.rule=Host(`yourdomain.com`)
 * traefik.http.services.redis.loadbalancer.server.url=123.42.12.21
 */
export const jelasticToTraefik = (env: EnvironmentsDetails) => {
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

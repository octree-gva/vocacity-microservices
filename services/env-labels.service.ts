import _ from "lodash";
import type { GetLabelsAction, ServiceDefinition, SetLabelsAction } from "../types";
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
const EnvironmentService: ServiceDefinition<
  {
    get: GetLabelsAction;
    set: SetLabelsAction;
  },
  []
> = {
  name: "env-labels",
  mixins: [],
  settings: {},
  actions: {
    get: {
      params: {
        envName: "string",
      },
      async handler({ params }) {
        try {
          const labels = await jelastic.labels({
            envName: params.envName,
          });
          return createSuccess(labels);
        } catch (e) {
          const { message } = e;
          if (`${message}`.startsWith("errors.")) {
            return create400(message);
          }
          return create400();
        }
      },
    },
    set: {
      params: {
        envName: "string",
        labels: "object",
      },
      async handler({ params }) {
        try {
          await jelastic.setLabels({
            envName: params.envName,
            labels: params.labels,
          });
        } catch (e) {
          const { message } = e;
          if (`${message}`.startsWith("errors.")) {
            return create400(message);
          }
          return create400();
        }

        return createSuccess();
      },
    },
  },
};
export default EnvironmentService;

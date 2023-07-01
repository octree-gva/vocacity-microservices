import _ from "lodash";
import AuthMixin from "../mixins/authorize.mixin";
import type { ServiceDefinition, VaultGetAction, VaultSetAction } from "../types";
import { create400, create404, createSuccess } from "../utils/createResponse";
import vault from "../utils/vault";

const VaultService: ServiceDefinition<
  {
    set: VaultSetAction;
    get: VaultGetAction;
  },
  [typeof AuthMixin]
> = {
  name: "vault",
  settings: {},
  mixins: [AuthMixin],
  actions: {
    get: {
      params: {
        bucket: "string",
        key: "string",
      },
      async handler(ctx) {
        const v = await vault();
        const { data, metadata } = await v.read(
          `voca/users/${ctx.params.bucket}/${ctx.params.key}`,
        );
        if (metadata?.destroyed) {
          throw create404();
        }
        return createSuccess(data);
      },
    },
    set: {
      params: {
        bucket: "string",
        key: "string",
        secrets: "object",
      },
      async handler(ctx) {
        try {
          const v = await vault();
          v.write(`voca/users/${ctx.params.bucket}/${ctx.params.key}`, ctx.params.secrets);
        } catch (e) {
          console.error(e);
          return create400();
        }
        return createSuccess();
      },
    },
  },
};
export default VaultService;

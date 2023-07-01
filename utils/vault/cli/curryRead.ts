import type { VaultResponse } from "./request";
import request from "./request";

export type Read = (path: string) => Promise<NonNullable<VaultResponse["data"]>>;
export type CurryRead = (token: string, mountPath?: string) => Read;

const curryRead: CurryRead =
  (token: string, mountPath = "secret") =>
  async (path: string) => {
    const { error, ...secrets } = await request.get<any, VaultResponse>(
      `${mountPath}/data/${path}`,
      {
        headers: {
          "X-Vault-Token": token,
        },
      },
    );
    if (!error && !!secrets?.data) {
      return secrets.data;
    }
    return {};
  };

export default curryRead;

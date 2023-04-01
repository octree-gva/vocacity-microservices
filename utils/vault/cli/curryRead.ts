import request, { VaultResponse } from './request';
const curryRead =
  (token: string, mountPath = 'secret') =>
  async (path: string) => {
    const { error, ...secrets } = await request.get<any, VaultResponse>(
      `${mountPath}/data/${path}`,
      {
        headers: {
          'X-Vault-Token': token
        }
      }
    );
    if (secrets.data) return secrets.data;
    return {};
  };

export default curryRead;

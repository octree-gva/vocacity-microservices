import request, { VaultResponse } from "./request";
const curryWrite =
	(token: string, mountPath = "secret") =>
	async (path: string, data: Record<string, string>) => {
		const { error, ...secrets } = await request.post<any, VaultResponse>(
			`${mountPath}/data/${path}`,
			{ data },
			{
				headers: {
					"X-Vault-Token": token,
				},
			},
		);
		if (secrets.data) return secrets.data;
		return {};
	};

export default curryWrite;

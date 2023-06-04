import type { VaultResponse } from "./request";
import request from "./request";

export type Write = (
	path: string,
	data: Record<string, string>,
) => Promise<NonNullable<VaultResponse["data"]>>;
export type CurryWrite = (token: string, mountPath?: string) => Write;

const curryWrite: CurryWrite =
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
		if (secrets.data) {
			return secrets.data;
		}
		return {};
	};

export default curryWrite;

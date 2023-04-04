import request, { VaultResponse } from "./request";

export type LoginFn = (username: string, password: string, mountPoint?: string) => Promise<string>;
const login: LoginFn = async (username, password, mountPoint = `${process.env.VAULT_PATH}`) => {
	const { error = undefined, ...data } = await request.post<any, VaultResponse>(
		`auth/${mountPoint ? `${mountPoint}/` : ""}login/${username}`,
		{
			password,
		},
	);
	if (!data.auth?.client_token) throw new Error("403");
	return data.auth?.client_token;
};
export default login;

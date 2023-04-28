// typescript ontology for voca, used around the project

import type { Job } from "bullmq";
import type { Context, GenericObject } from "moleculer";

export type Thing = {};
export type Action = Thing;
export type ServiceHandlerFun<T extends Action> = (
	ctx: Context<T, Record<string, string>, GenericObject>,
) => Promise<VocaResponse>;

type KeysOfType<T, U> = { [K in keyof T]: K }[keyof T];
export type ServiceDefinition<T extends Record<string, Action>> = Thing & {
	name: string;
	mixins?: unknown[];
	settings?: any;
	adapter?: unknown;
	actions: {
		[K in keyof T]: {
			queue?:
				| true
				| (<S extends KeysOfType<T, "string">>(
						ctx: Context<T[K], {}, GenericObject>,
						queue: string,
						event: S,
						payload: T[S],
						options: { priority: number },
				  ) => Promise<Job>);
			params?: Record<keyof T[K], Record<string, string | number> | string>;
			graphql?: unknown;
			localQueue?: <S extends KeysOfType<T, "string">>(
				ctx: Context<T[K], {}, GenericObject>,
				event: S,
				payload: T[S],
				options: { priority: number },
			) => Promise<Job>;
			handler: ServiceHandlerFun<T[K]>;
		};
	};
	model?: unknown;
};
export type UserRegistrationAction = Action & {
	email: string;
	password: string;
	passwordConfirmation: string;
};

export type UserLoginAction = Action & {
	email: string;
	password: string;
};

export type UserResetPasswordAction = Action & {
	newPassword: string;
	token: string;
};

export type IntrospectAction = Action & {
	token: string;
};

export type ParkAction = Action & {
	template: string;
};

export type EnvironmentStatus = Action & {};
export type GetLabelsAction = Action & {
	envName: string;
};
export type SetLabelsAction = GetLabelsAction & {
	labels: Record<string, string>;
};
export type VaultGetAction = Action & {
	bucket: string;
	key: string;
};
export type VaultSetAction = VaultGetAction & {
	secrets: Record<string, string>;
};
export type RoutingAction = Action & {
	token: string;
};
export type RoutingTokenAction = Action & {};

export type Credential = Thing & {
	jwt: string;
};

export type ParsedJWT = Thing & {
	sub: string;
	aud: string[];
	data: Record<string, unknown> & {
		email: string;
	};
	active: boolean;
};
export type VocaResponse = Thing & {
	code: number;
};
export type VocaError = VocaResponse & {
	code: number;
	message: string;
	i18nMessage: string;
};

export type ServiceResponse<T> = VocaResponse & {
	code: 200 | 201;
} & T;
export type DBResponse<T> = Thing & { dataValues: T; _previousDataValues?: T };

export type User = Thing & {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
};
export type Organization = Thing & {
	id: string;
	name: string;
};
export type UserPermission = {
	user_id: string;
	user?: User;
	organisation_id: string;
	permissions: string;
};

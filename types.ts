// typescript ontology for voca, used around the project

import type { Context, GenericObject } from "moleculer";

export type Thing = {};
export type Action = Thing;
export type ServiceHandlerFun<T extends Action> = (
	ctx: Context<T, {}, GenericObject>,
) => Promise<VocaResponse>;
export type ServiceDefinition<T extends Record<string, Action>> = Thing & {
	name: string;
	mixins?: unknown[];
	settings?: unknown;
	adapter?: unknown;
	actions: {
		[K in keyof T]: {
			params?: Record<string, Record<string, string | number> | string>;
			graphql?: unknown;
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

export type UserPermission = {
	user_id: string;
	user?: User;
	organisation_id: string;
	permissions: string;
};

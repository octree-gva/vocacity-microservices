// typescript ontology for voca, used around the project

import type { Job } from "bullmq";
import type {
	ActionParamTypes,
	ActionSchema,
	Context,
	GenericObject,
	LoggerInstance,
	ServiceSchema,
	ServiceSettingSchema,
} from "moleculer";

export type Thing = {};
export type Action = Thing;
export type ActionResponse = Thing | void;
export type ServiceHandlerFun<T extends Action> = (
	ctx: Context<T, ContextMeta, ContextLocals>,
) => Promise<VocaResponse>;
export type MixinFun<T extends Action, K extends ActionResponse> = (
	ctx: Context<T, ContextMeta, ContextLocals>,
	action?: any,
	req?: any,
) => Promise<K>;

type KeysOfType<T, U> = { [K in keyof T]: K }[keyof T];
export type ContextMeta = GenericObject & {
	user?: string;
	bearer?: string;
};
export type ContextLocals = GenericObject & {
	token?: ParsedJWT;
	roles?: string[];
};
type MixinDefinition = Thing & ServiceSchema;
type MergeMixinMethods<M extends MixinDefinition[]> = M extends [infer F, ...infer R]
	? F extends MixinDefinition
		? R extends MixinDefinition[]
			? MergeMixinMethods<R>
			: never
		: {}
	: {};
export interface ServiceDefinition<T extends Record<string, Action>> extends ServiceSchema {
		mixins: MixinDefinition[];
		actions: {
			[K in keyof T]: ActionSchema & {
				params?: Record<keyof T[K], ActionParamTypes>;
				handler: ServiceHandlerFun<T[K]> & ThisType<MergeMixinMethods<this['mixins']>>;
				queue?:
					| true
					| (<S extends KeysOfType<T, "string">>(
							ctx: Context<T[K], ContextMeta, ContextLocals>,
							queue: string,
							event: S,
							payload: T[S],
							options: { priority: number },
					  ) => Promise<Job>);
				graphql?: unknown;
				localQueue?: <S extends KeysOfType<T, "string">>(
					ctx: Context<T[K], ContextMeta, ContextLocals>,
					event: S,
					payload: T[S],
					options: { priority: number },
				) => Promise<Job>;
				logger?: LoggerInstance;
			};
		};
	};
export type ServicePolicies = Array<string>;

export type UserRegistrationAction = Action & {
	email: string;
	password: string;
	passwordConfirmation: string;
};
export type ServiceTokenAction = MixinFun<{}, { token: string }>;
export type CheckUserAction = MixinFun<{}, void>;
export type CheckIsAuthenticatedAction = MixinFun<{}, void>;
export type CheckUserRoleAction = MixinFun<{}, void>;
export type IntrospectBearerAction = MixinFun<{}, { token: ParsedJWT }>;

export type UserLoginAction = Action & {
	email: string;
	password: string;
};
export type VocaCliRunAction = Action;

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

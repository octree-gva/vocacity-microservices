// typescript ontology for voca, used around the project

import type { Job, JobState } from "bullmq";
import type {
	ActionParamTypes,
	ActionSchema,
	Context,
	GenericObject,
	LoggerInstance,
	ServiceSchema,
} from "moleculer";
export type APP_IDS = "decidim" /* | yrpriorities | consul | loomio | etc. */;

export type Thing = {};
export type Action = Thing & {
	params: {};
	returns: {};
};
export type ActionResponse = Thing | void;
export type ServiceHandlerFun<Param extends Thing, ReturnType extends Thing> = (
	ctx: Context<Param, ContextMeta, ContextLocals>,
) => Promise<VocaResponse<ReturnType> | VocaError>;
type DeepMerge<T extends object, U extends object> = U extends any[]
	? T
	: U extends object
	? T & {
			[K in keyof U]: K extends keyof T
				? DeepMerge<T[K] extends object ? T[K] : {}, U[K] extends object ? U[K] : {}>
				: U[K];
	  }
	: T;

type ExtractMethods<T> = T extends { methods: infer M } ? M : {};
type ExtractAttributes<T> = Exclude<T, { methods: any }>;

type MergeDeep<T extends object[]> = T extends []
	? {}
	: {
			[K in keyof T]: T[K] extends infer Item
				? DeepMerge<ExtractMethods<Item> & object, ExtractAttributes<Item> & object>
				: never;
	  }[number];

export type MixinFun<T extends Action> = (
	ctx: Context<T["params"], ContextMeta, ContextLocals>,
	action?: any,
	req?: any,
) => Promise<T["returns"] extends void ? void : T["returns"]>;

type KeysOfType<T, U> = { [K in keyof T]: K }[keyof T];
export type ContextMeta = GenericObject & {
	user?: string;
	bearer?: string;
};
export type ContextLocals = GenericObject & {
	token?: ParsedJWT;
	roles?: string[];
};
type MixinDefinition = Thing & Partial<ServiceSchema>;
export interface ServiceDefinition<
	ServiceActions extends Record<string, Action>,
	ServiceMixins extends MixinDefinition[],
> extends ServiceSchema {
	mixins?: ServiceMixins;
	actions: {
		[K in keyof ServiceActions]: Omit<ActionSchema, "params" | "handler"> & {
			params?: Record<keyof ServiceActions[K]["params"], ActionParamTypes>;
			handler: ThisType<MergeDeep<ServiceMixins>> &
				ServiceHandlerFun<ServiceActions[K]["params"], ServiceActions[K]["returns"]>;
			queue?:
				| true
				| (<S extends KeysOfType<ServiceActions, "string">>(
						ctx: Context<ServiceActions[K], ContextMeta, ContextLocals>,
						queue: string,
						event: S,
						payload: ServiceActions[S],
						options: { priority: number },
				  ) => Promise<Job>);
			graphql?: unknown;
			localQueue?: <S extends KeysOfType<ServiceActions, "string">>(
				ctx: Context<ServiceActions[K]["params"], ContextMeta, ContextLocals>,
				event: S,
				payload: ServiceActions[S]["params"],
				options: { priority: number },
			) => Promise<Job>;
			logger?: LoggerInstance;
		};
	};
}
export type ServicePolicies = Array<string>;

export type UserRegistrationAction = Action & {
	params: { email: string; password: string; passwordConfirmation: string };
	returns: { jwt: string };
};
export type ServiceTokenAction = MixinFun<Action & { returns: { token: string } }>;
export type CheckUserAction = MixinFun<Action & { returns: void}>;
export type CheckIsAuthenticatedAction = MixinFun<Action & { returns: void}>;
export type CheckUserRoleAction = MixinFun<Action& { returns: void}>;
export type IntrospectBearerAction = MixinFun<Action & { returns: { token: ParsedJWT } }>;

export type UserLoginAction = Action & {
	params: { email: string; password: string };
	returns: { jwt: string };
};
export type VocaCliRunAction = Action;

export type UserResetPasswordAction = Action & {
	params: {newPassword: string;
	token: string;}, returns: {ok: boolean}
};

export type IntrospectAction = Action & {
	params: { token: string };
	returns: ParsedJWT;
};

export type ParkAction = Action & {
	params: { template: string };
	returns: SerializedJob;
};

export type EnvironmentStatus = Action & { returns: { data: any } };

export type GetLabelsAction = Action & {
	params: { envName: string };
	returns: Record<string, string>;
};
export type SetLabelsAction = GetLabelsAction & {
	params: { labels: Record<string, string> };
};
export type VaultGetAction = Action & {
	params: {
		bucket: string;
		key: string;
	};
};
export type VaultSetAction = VaultGetAction & {
	params: VaultGetAction["params"] & { secrets: Record<string, string> };
	returns: { code: number };
};
export type RoutingAction = Action & {
	params: { token: string };
	returns: { config: Record<string, unknown> };
};
export type RoutingTokenAction = Action & { returns: { token: string } };

export type Credential = Thing & {
	params: { jwt: string };
};
export type SerializedJob = Thing & {
	id: Job["id"];
	action: string;
	queue: string;
	status: JobState | unknown;
	data: Job["data"];
	failedReason: Job["failedReason"];
	progress: Job["progress"];
	returnvalue: Job["returnvalue"];
	attemptsMade: Job["attemptsMade"];
	delay: Job["delay"];
	timestamp: Job["timestamp"];
};
export type ParsedJWT = Thing & {
	sub: string;
	aud: string[];
	data: Record<string, unknown> & {
		email: string;
	};
	active: boolean;
};
export type VocaResponse<T extends any = any> = Thing & {
	code: number;
} & T;
export type VocaError = VocaResponse<{
	message: string;
	i18nMessage: string;
}>;

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
export type Deployment = {
	organisation_id: Organization["id"],
	creator_id: User["id"],
	env_name: string,
	app_id: APP_IDS,
}
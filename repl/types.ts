import { ServiceBroker } from "moleculer";

export type ReplCommand = {
	command: string;
	description: string;
	alias: string;
	options: Array<any>;
	types: Record<string, Array<string>>;
	allowUnknownOptions: boolean;
	action: (broker: ServiceBroker, args: any) => any;
};

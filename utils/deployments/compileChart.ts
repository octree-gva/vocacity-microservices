import { existsSync, readFileSync } from "fs";
import path from "path";
import _ from "lodash";
import internalSecrets from "./internalSecrets";
import VaultBuilder from "./VaultBuilder";

const compileChart = async (templatePath: string, settings = {}) => {
	const relativeTemplatePath = path.join(`./infra/charts/`, `${templatePath}.tpl`);
	if (!existsSync(relativeTemplatePath)) {
		throw new Error(`Template not found`);
	}
	const chartString = readFileSync(relativeTemplatePath).toString();
	const secrets = await internalSecrets();
	const vault = new VaultBuilder(secrets || {});
	const compiled = _.template(chartString, {
		interpolate: /{{([\s\S]+?)}}/g,
		imports: { vault },
	});
	return {
		compiled: compiled({
			appName: process.env.APP_NAME,
			appHost: process.env.APP_HOST,
			...settings,
		}),
		variables: vault.secrets,
	};
};

export default compileChart;

import _ from "lodash";
import { table, getBorderCharacters, TableUserConfig } from "table";
import kleur from "kleur";
import { EnvironmentsDetails } from "../utils/jelastic/environment/environmentsDetails";
import { ReplCommand } from "./types";
const DecidimRepl: ReplCommand = {
  command: "decidim.list",
  description: "List all the decidims",
  alias: "d.ps",
  options: [],
  types: {},
  allowUnknownOptions: false,
  async action(broker, args) {
    const headers = [
      kleur.bold("Url"),
      kleur.bold("Status"),
      kleur.bold("Detached?"),
      kleur.bold("Parked?"),
    ];

    const { data: environments } = await broker.call<{ data: EnvironmentsDetails[] }>(
      "env-inspect.details",
    );
    const data = [
      headers,
      ...environments.map((env) => {
        if (!env) return [];
        const { properties } = env;
        // Convert dotted notation in deepHash
        const props = Object.keys(properties).reduce((acc, curr) => {
          _.set(acc, curr, properties[curr]);
          return acc;
        }, {});
        const url = _.get(props, "voca.url", _.get(env, "displayName"));
        const status = statusColor(env.status);
        const isDetached = !_.get(props, "traefik.enabled", false);
        const isParked = !_.get(props, "voca.parked", false);
        return [url, status, isDetached, isParked];
      }),
    ] as unknown[][];

    const tableConf: TableUserConfig = {
      border: _.mapValues(getBorderCharacters("honeywell"), (char) => kleur.gray(char)),
      columns: {
        1: { alignment: "right" },
        2: { alignment: "right" },
        3: { alignment: "right" },
        4: { alignment: "right" },
      },
      drawHorizontalLine: (index: number, count: number) =>
        index == 0 || index == 1 || index == count,
    };
    console.log(table(data, tableConf));
    return table(data, tableConf);
  },
};

export default DecidimRepl;

const statusColor = (status: EnvironmentsDetails["status"]) => {
  switch (status) {
    case "migrating":
    case "exporting":
    case "updating":
    case "going_to_sleep":
    case "restoring":
    case "sleep":
    case "cloning":
    case "launching":
      return kleur.bgYellow().black(_.pad(`${status}`.toUpperCase(), 12));
    case "unknown":
    case "down":
    case "broken":
    case "stopping":
    case "not_exists":
    case "creating":
      return kleur.bgRed().white(_.pad(`${status}`.toUpperCase(), 12));
    case "running":
      return kleur.bgGreen().white(_.pad(`${status}`.toUpperCase(), 12));
  }
};

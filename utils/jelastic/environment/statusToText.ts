import _ from "lodash";

export type EnvironmentStatus =
  | "running"
  | "down"
  | "launching"
  | "sleep"
  | "unknown"
  | "creating"
  | "cloning"
  | "not_exists"
  | "exporting"
  | "migrating"
  | "broken"
  | "updating"
  | "stopping"
  | "going_to_sleep"
  | "restoring";

export type StatusToTextFun = (status: number) => EnvironmentStatus;

const statusToText: StatusToTextFun = (status: number) =>
  _.get(
    [
      "unknown",
      "running",
      "down",
      "launching",
      "sleep",
      "unknown",
      "creating",
      "cloning",
      "not_exists",
      "exporting",
      "migrating",
      "broken",
      "updating",
      "stopping",
      "going_to_sleep",
      "restoring",
    ] as EnvironmentStatus[],
    status,
    "unknown",
  );
export default statusToText;

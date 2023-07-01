import { GraphQLError } from "graphql";
import type { VocaError } from "../types";

export type CreateError = (
  code: VocaError["code"],
  i18nMessage: VocaError["i18nMessage"],
  message?: VocaError["message"],
) => VocaError;
export const createError: CreateError = (code, i18nMessage, message = "") => ({
  code,
  message,
  i18nMessage,
});

export const create400 = (
  i18nMessage: VocaError["i18nMessage"] = "errors.requests.bad_request",
  message: VocaError["message"] = "",
) => createError(400, i18nMessage, message);
export const create404 = (
  i18nMessage: VocaError["i18nMessage"] = "errors.requests.not_found",
  message: VocaError["message"] = "",
) => createError(404, i18nMessage, message);
export const create500 = (
  i18nMessage: VocaError["i18nMessage"] = "errors.requests.internal",
  message: VocaError["message"] = "",
) => createError(500, i18nMessage, message);
export const createGraphql400 = (
  i18nMessage: VocaError["i18nMessage"] = "errors.requests.bad_request",
) =>
  new GraphQLError(i18nMessage, undefined, undefined, undefined, undefined, undefined, {
    code: "BAD_USER_INPUT",
  });
export const createGraphql404 = (
  i18nMessage: VocaError["i18nMessage"] = "errors.requests.not_found",
) =>
  new GraphQLError(i18nMessage, undefined, undefined, undefined, undefined, undefined, {
    code: "BAD_USER_INPUT",
  });
export default createError;

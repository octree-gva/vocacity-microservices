import _ from "lodash";
import vault from "../vault";

export type InternalSecretsFun = () => Promise<Record<string, string | Record<string, string>>>;

/**
 * Get secrets from vault (voca/internals) and parse
 * smtp credentials.
 */
const internalSecrets: InternalSecretsFun = async () => {
  const v = await vault();
  const { data: credentials } = await v.read(`voca/internals`);
  const smtp = {
    domain: _.get(credentials, "smtp.domain", ""),
    address: _.get(credentials, "smtp.address", ""),
    username: _.get(credentials, "smtp.username", ""),
    password: _.get(credentials, "smtp.password", ""),
    port: _.get(credentials, "smtp.port", "578"),
    from_email: _.get(credentials, "smtp.from_email", "hello@voca.city"),
  };
  return { smtp };
};

export default internalSecrets;

import type { Read, Write } from "./cli";
import { curryRead, curryWrite, login } from "./cli";

type GetVault = () => Promise<{
  read: Read;
  write: Write;
}>;

const getVault: GetVault = async () => {
  const mountPath = `${process.env.VAULT_PATH}`;
  let token;
  try {
    token = await login(`${process.env.VAULT_USER}`, `${process.env.VAULT_PASSWORD}`, mountPath);
  } catch (e) {
    throw new Error("errors.vault.login_error");
  }
  return {
    read: curryRead(token),
    write: curryWrite(token),
  };
};

export default getVault;

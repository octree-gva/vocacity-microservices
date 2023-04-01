import { login, curryRead } from './cli';
import curryWrite from './cli/curryWrite';

const getVault = async () => {
  const mountPath = `${process.env.VAULT_PATH}`;
  let token;
  try{
    token = await login(
      `${process.env.VAULT_USER}`,
      `${process.env.VAULT_PASSWORD}`,
      mountPath
      );
  }catch(e){
    console.error({user: process.env.VAULT_USER, password: process.env.VAULT_PASSWORD, mountPath })
    throw new Error("Can not login to the vault")
  }
  return {
    read: curryRead(token),
    write: curryWrite(token)
  };
};

export default getVault;

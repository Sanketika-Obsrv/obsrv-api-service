import { config } from "../configs/Config";

export const getAuthorizationHeader = () => {
  const druidAuthEnabled = config.query_api.druid.druid_auth_enabled;
  if (druidAuthEnabled) {
    const druidUserName = config.query_api.druid.druid_user;
    const druidUserPassword = config.query_api.druid.druid_password;
    const credentials = `${druidUserName}:${druidUserPassword}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');
    return {
      "Authorization": `Basic ${base64Credentials}` 
    };
  } else {
    return {};
  }
}

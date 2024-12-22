import { HonoRequest } from "hono/request";

/**
 * Azure functions will return the IP address in the X-Forwarded-For header, e.g. 234.33.55.147:3656
 * @ref: https://demiliani.com/2022/07/11/azure-functions-getting-the-client-ip-address/
 * @param req 
 * @returns 
 */
export function getIpAddress(req: HonoRequest): string | null {
  const xForwardedFor = req.header('X-Forwarded-For');
  if (!xForwardedFor) {
    return null;
  }
  return xForwardedFor.split(':')[0];
}
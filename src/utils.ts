import { HonoRequest } from "hono/request";

/**
 * Azure functions will return the IP address in the X-Forwarded-For header, e.g. 234.33.55.147:3656
 * @ref: https://demiliani.com/2022/07/11/azure-functions-getting-the-client-ip-address/
 * @param req 
 * @returns When local development, it will return null
 */
export function getIpAddress(req: HonoRequest): string | null {
  const xForwardedFor = req.header('X-Forwarded-For');
  if (!xForwardedFor) {
    return null;
  }
  return xForwardedFor.split(':')[0];
}


export async function hashed(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const hased = String.fromCharCode(...new Uint8Array(buf.slice(0, 16)));
  return btoa(hased).replace(/=+$/, "");
}

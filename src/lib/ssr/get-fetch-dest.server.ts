import { createServerOnlyFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const getSecFetchDest = createServerOnlyFn((): string | null => {
  try {
    const req = getRequest();
    return req?.headers.get("sec-fetch-dest") ?? null;
  } catch {
    return null;
  }
});

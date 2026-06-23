import { startWebServer } from "../web/server";

export async function serve(): Promise<void> {
  await startWebServer({ port: 4111 });
}

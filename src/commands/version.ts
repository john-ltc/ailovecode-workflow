import path from "path";
import { getPackageRoot } from "../workflow/paths";

export function version(): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pkg = require(path.join(getPackageRoot(), "package.json"));
  console.log(`AILoveCode Workflow v${pkg.version}`);
}

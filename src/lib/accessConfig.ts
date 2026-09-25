// Split from access.ts so scripts/build-access-code.ts (which generates this
// JSON file) can import the pure logic in access.ts without a circular
// dependency on its own output. Only the browser-side AccessGate imports this.
import accessData from "../../data/generated/access.json";

export const ACCESS_CODE_HASH: string = accessData.codeHash;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.version = version;
const path_1 = __importDefault(require("path"));
const paths_1 = require("../workflow/paths");
function version() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require(path_1.default.join((0, paths_1.getPackageRoot)(), "package.json"));
    console.log(`AILoveCode Workflow v${pkg.version}`);
}

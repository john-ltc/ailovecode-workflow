"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serve = serve;
const server_1 = require("../web/server");
async function serve() {
    await (0, server_1.startWebServer)({ port: 4111 });
}

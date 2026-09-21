const { createUser } = require("./user-controller");

function registerRoutes(router) {
  router.post("/users", createUser);
}

module.exports = { registerRoutes };

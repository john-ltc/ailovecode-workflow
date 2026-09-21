const userService = require("./user-service");

function createUser(request, response) {
  const user = userService.create(request.body);
  response.json(user);
}

module.exports = { createUser };

const userRepository = require("./user-repository");

function create(input) {
  return userRepository.insert({ email: input.email });
}

module.exports = { create };

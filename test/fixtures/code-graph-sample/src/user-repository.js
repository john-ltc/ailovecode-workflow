function insert(user) {
  return database.table("users").insert(user);
}

module.exports = { insert };

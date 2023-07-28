//驗證

const bcrypt = require("bcryptjs");

const password = "Hannah1202";

const hash = "$2a$10$BfFRZxSTwgIrBKtyW25gxepy9jtPqt48KUrdmxunj7ArYL.bQZ2Ce";

const result = bcrypt.compareSync(password, hash);

console.log(result);

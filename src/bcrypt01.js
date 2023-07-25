//編碼

const bcrypt = require("bcryptjs");

const password = "hannah1202";

const hash = bcrypt.hashSync(password, 10);

console.log(hash);

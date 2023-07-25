//驗證

const bcrypt = require("bcryptjs");

const password = "hannah1202";

const hash = "$2a$10$sVzszHnmycmEo/R7l.4SJO77C1CRBCLzQcpBxdn8sAFU.w0ZysKf.";

const result = bcrypt.compareSync(password, hash);

console.log(result);

require('dotenv').config();

// console.log(process.env);

const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;

console.log({ DB_HOST, DB_USER, DB_PASS, DB_NAME });


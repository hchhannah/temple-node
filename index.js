if (process.argv[2] === "mac") {
  require("dotenv").config({
    path: __dirname + "/mac.env",
  });
} else {
  require("dotenv").config();
}
console.log(process.argv);

const express = require("express");

const app = express();

// 環境(node和next不同localhost)
const cors = require("cors");

const corsOptions = {
  credentials: true,
  origin: (origin, cb) => {
    console.log({ origin });
    cb(null, true);
  },
};

app.use(cors(corsOptions));

// leodder test
// app.get('/try-db', async (req, res)=>{
//   const [rows] = await db.query('SELECT * FROM `post` LIMIT 2');
//   res.json(rows);
// });

// 前端傳資料用
const bodyParser = require("body-parser");

app.use(bodyParser.json());

app.set("view engine", "ejs");

const router = express.Router();
const db = require(__dirname + "/modules/mysql2");
// 照片上傳
const upload = require(__dirname + "/modules/img-upload.js");

// 測試用(localhost:3002)
app.get("/", (req, res) => {
  res.send("<h1>This is template</h1>");
});

// 商品資料api
app.use("/shop", require(__dirname + "/routes/products-api"));

// 會員資料api
app.use("/member", require(__dirname + "/routes/products-api"));

//論壇資料api
app.use("/forum", require(__dirname + "/routes/forum-api"));

// 定義PORT
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`啟動${port}`);
});

app.use(express.static("public"));
app.use(express.static("node_modules/bootstrap/dist"));
app.use(express.static("node_modules/jquery/dist"));

//自訂middleware 6/14 15:50
// app.use((req, res, next)=>{
//   res.locals.nickname = '冬瓜標';
//   res.locals.title = '錦囊廟計';
// })
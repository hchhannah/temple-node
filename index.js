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

// keyword
// 'use strict';

// /**
//  * Decode Zhuyin password from Chinese words
//  * @param {string} input whatever you input in Chinese
//  * @return {string}
//  */
// module.exports = input => {
//     const dict = require('./data/dict.js');
//     const zhuyin = require('./lib/cjst.js').cjst.chineseToZhuyin(input);
//     return zhuyin.toString().replace(/,/ig, '').split('').reduce((res, val) => res + dict[val], '');
// };


// 前端傳資料用
const bodyParser = require("body-parser");

app.use(bodyParser.json());

app.set("view engine", "ejs");

const router = express.Router();
const db = require(__dirname + "/modules/mysql2");
// 照片上傳
const upload = require(__dirname + "/modules/img-upload.js");
const jwt = require("jsonwebtoken");

// 0728 自訂 middleware JWT authorization
app.use((req, res, next) => {
  res.locals.nickname = "小新";
  res.locals.title = "小新的網站";

  //template helper functions
  res.locals.toDateString = (d) => {
    const fm = "YYYY-MM-DD";
    const djs = dayjs(d);
    return djs.format(fm);
  };
  res.locals.toDatetimeString = (d) => {
    const fm = "YYYY-MM-DD  HH:mm:ss";
    const djs = dayjs(d);
    return djs.format(fm);
  };

  const auth = req.get("Authorization");
  if (auth && auth.indexOf("Bearer ") === 0) {
    const token = auth.slice(7);
    let jwtData = null;
    try {
      jwtData = jwt.verify(token, process.env.JWT_SECRET);

      // 測試的情況, 預設是登入

      // jwtData = {
      //   id: "1b1963b1-0bdd-45ef-bea1-d13436b773b2",
      //   email: "黃琪涵",
      // };
    } catch (ex) {}
    if (jwtData) {
      res.locals.jwtData = jwtData; // 標記有沒有使用 token
    }
  }

  next();
});

// 測試用(localhost:3002)
app.get("/", (req, res) => {
  res.send("<h1>This is template</h1>");
});


// 商品資料api
app.use('/shop', require(__dirname + '/routes/products-api') );

//論壇資料api
app.use("/forum", require(__dirname + "/routes/forum-api"));

// 會員資料api
app.use("/member", require(__dirname + "/routes/member-api"));
// 求籤資料api
app.use("/pray", require(__dirname + "/routes/pray-api"));
// 遶境資料api
app.use("/pilgrimage", require(__dirname + "/routes/pilgrimage-api"));

app.use("/worship", require(__dirname + "/routes/worship-api"));

// 定義PORT
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`啟動${port}`);
});

app.use(express.static("public"));
app.use(express.static("node_modules/bootstrap/dist"));
app.use(express.static("node_modules/jquery/dist"));
console.log(`啟動${port}`);

// app.use(express.static("public"));
// app.use(express.static("node_modules/bootstrap/dist"));
// app.use(express.static("node_modules/jquery/dist"));

//自訂middleware 6/14 15:50
// app.use((req, res, next)=>{
//   res.locals.nickname = '冬瓜標';
//   res.locals.title = '錦囊廟計';
// })

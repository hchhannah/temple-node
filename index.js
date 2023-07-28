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

// 前端傳資料用
const bodyParser = require("body-parser");

app.use(bodyParser.json());

app.set("view engine", "ejs");

const router = express.Router();
const db = require(__dirname + "/modules/mysql2");
// 照片上傳
const upload = require(__dirname + "/modules/img-upload.js");

// 0728 自訂 middleware JWT authorization
app.use((req, res, next) => {
  res.locals.nickname = "小新";
  res.locals.title = "小新的網站";

  // template helper functions
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
      //   id: 12,
      //   email: 'test@test.com'
      // }
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
app.use("/shop", require(__dirname + "/routes/products-api"));

// 會員資料api
app.use("/member", require(__dirname + "/routes/member-api"));

// 定義PORT
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`啟動${port}`);
});

app.use(express.static("public"));
app.use(express.static("node_modules/bootstrap/dist"));
app.use(express.static("node_modules/jquery/dist"));

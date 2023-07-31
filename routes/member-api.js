const express = require("express");
const db = require(__dirname + "/../modules/mysql2");
const dayjs = require("dayjs");
const router = express.Router();
const upload = require(__dirname + "/../modules/img-upload");
const multipartParser = upload.none();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

router.use((req, res, next) => {
  res.locals.title = "會員資料 | " + res.locals.title;
  next();
});

// // 取得單筆資料的 api, (要通過登入驗證)
// router.get("/api/verify/:sid", async (req, res) => {
//   const output = {
//     success: false,
//     error: "",
//     data: null,
//   };
//   // 0711 server端檢查token時 在後端index.js 裡面自訂middleware找過 每個API權限管控不一 一般瀏覽 加入最愛需要
//   if (!res.locals.jwtData) {
//     output.error = "沒有 token 驗證";
//     return res.json(output);
//   } else {
//     output.jwtData = res.locals.jwtData; // 測試用
//   }
//   // 回傳  "jwtData": {
//   //     "id": 3,
//   //     "email": "ming@gg.com",
//   //     "iat": 1689057384
//   // }

//   const sid = parseInt(req.params.sid) || 0;
//   if (!sid) {
//     output.error = "錯誤的 id";
//     return res.json(output);
//   }

//   // const sql = `SELECT * FROM member WHERE sid=?${sid}`;
//   // const [rows] = await db.query(sql);
//   const sql = `SELECT * FROM member WHERE sid=?`;
//   const [rows] = await db.query(sql, [sid]);
//   if (!rows.length) {
//     output.error = "沒有資料";
//     return res.json(output);
//   }
//   // rows[0].birthday = dayjs(rows[0].birthday).format("YYYY-MM-DD");
//   output.success = true;
//   output.data = rows[0];

//   res.json(output);
//   // });

//   // 取得單筆資料的 api 0711
//   // 測試 :localhost:3002/ab/api/*65
//   router.get("/api/:sid", async (req, res) => {
//     const output = {
//       success: false,
//       error: "",
//       data: null,
//     };

//     const sid = parseInt(req.params.sid) || 0;
//     if (!sid) {
//       output.error = "錯誤的 id";
//       return res.json(output);
//     }

//     const sql = `SELECT * FROM members WHERE sid=${sid}`;
//     const [rows] = await db.query(sql);
//     if (!rows.length) {
//       output.error = "沒有資料";
//       return res.json(output);
//     }
//     // 這行用來做測試
//     // rows[0].birthday = dayjs(rows[0].birthday).format("YYYY-MM-DD");
//     output.success = true;
//     output.data = rows[0];

//     res.json(output);
//   });

//   // router.get("/", async (req, res) => {
//   //   const output = await getListData(req);

//   //   if (output.redirect) {
//   //     return res.redirect(output.redirect);
//   //   }
//   //   res.render("members/index", output);
// });

//會員登入 - 0711  密碼比對
router.post("/login", async (req, res) => {
  const output = {
    success: false,
    code: 0,
    error: "",
  };
  if (!req.body.member_account || !req.body.member_password) {
    output.error = "欄位資料不足哈哈哈";
    return res.json(output);
  }

  const sql = "SELECT * FROM members WHERE member_account=?";
  const [rows] = await db.query(sql, [req.body.member_account]);
  if (!rows.length) {
    // 帳號是錯的
    output.code = 402;
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }
  const verified = await bcrypt.compare(
    req.body.member_password,
    rows[0].member_password
  );
  // (req.body.password -> 用戶傳進來的密碼 | rows[0].password -> rows[0]第一筆也只會有一筆)
  // 最上面要 const bcrypt = require("bcryptjs");
  if (!verified) {
    // 密碼是錯的
    output.code = 406;
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }
  output.success = true;

  // 包 jwt 傳給前端 0711 {}包越多項目token越長 但下面也不一定要顯示
  const token = jwt.sign(
    {
      id: rows[0].member_id,
      // member_account: rows[0].member_account,
      name: rows[0].member_name,
    },
    process.env.JWT_SECRET
  );

  output.data = {
    id: rows[0].member_id,
    // member_account: rows[0].member_account,
    name: rows[0].member_name,
    token,
  };
  res.json(output);
});

// 會員註冊 新增資料的功能
router.post("/signUp", multipartParser, async (req, res) => {
  // TODO: 要檢查欄位資料

  // 0728 檢查 email 是否已存在
  const checkEmailQuery =
    "SELECT COUNT(*) AS count FROM `members` WHERE `member_account` = ?";
  const [emailResult] = await db.query(checkEmailQuery, [
    req.body.member_account,
  ]);
  const emailExists = emailResult[0].count > 0;

  if (emailExists) {
    return res.status(409).json({ error: "該 email 已被使用。" });
  }

  //將密碼用bcrypt編碼

  const password = bcrypt.hashSync(req.body.member_password, 10);

  console.log("輸入密碼:", req.body.member_password);
  console.log("bcrypt雜湊:", password);

  // email 不存在，執行插入操作
  const sql =
    "INSERT INTO `members`" +
    "(`member_id`, `member_account`, `member_password`,`member_name`, `member_address`, `member_birthday`, `member_forum_name`, `member_profile`)" +
    " VALUES ( ?, ?, ?, ?, ?, ?, null,null)";

  function generateMemberId() {
    // Generate a version 4 UUID (random UUID)
    return uuidv4();
  }

  let member_id = generateMemberId();

  // 0728 讓生日格式一致
  let birthday = dayjs(req.body.member_birthday);
  if (birthday.isValid()) {
    birthday = birthday.format("YYYY-MM-DD");
  } else {
    birthday = null;
  }

  const [result] = await db.query(sql, [
    member_id,
    req.body.member_account,
    password,
    req.body.member_name,
    req.body.member_address,
    birthday,
    req.body.member_forum_name,
    req.body.member_profile,
  ]);

  res.json({
    result,
    postData: req.body,
  });
});

//會員資料 (抓資料看這個)
router.get("/personalinfo", async (req, res) => {
  // let { sid } = req.params;

  const output = {
    success: false,
    code: 0,
    error: "",
  };

  if (!res.locals.jwtData) {
    output.error = "沒有驗證";
    return res.json(output);
  } else {
    output.jwtData = res.locals.jwtData; // 測試用
  }

  const member_id = res.locals.jwtData.id;

  const [rows] = await db.query(`SELECT * FROM members WHERE member_id=?`, [
    member_id,
  ]);

  if (!rows.length) {
    return res.redirect(req.baseUrl);
  }

  res.json(rows[0]);
});

//會員資料 抓資料看這個

router.put("/personalinfo", async (req, res) => {
  const output = {
    success: false,
    code: 0,
    error: "",
  };

  if (!res.locals.jwtData) {
    output.error = "沒有驗證";
    return res.json(output);
  } else {
    output.jwtData = res.locals.jwtData; // 測試用
  }

  const member_id = res.locals.jwtData.id;
  const dataObj = { ...req.body }; // 使用整個 req.body 作為 dataObj

  try {
    // 0731 檢查 email 和手機是否已存在，排除目前使用者自己的 email 和 phone
    const checkEmailAndPhoneQuery =
      "SELECT COUNT(*) AS emailCount, (SELECT COUNT(*) FROM `members` WHERE `member_phone` = ? AND `member_id` <> ?) AS phoneCount FROM `members` WHERE (`member_account` = ? AND `member_id` <> ?)";
    const [result] = await db.query(checkEmailAndPhoneQuery, [
      req.body.member_phone,
      member_id,
      req.body.member_account,
      member_id,
    ]);
    const { emailCount, phoneCount } = result[0];

    if (emailCount > 0) {
      return res.status(409).json({ error: "該 email 已被使用。" });
    }

    if (phoneCount > 0) {
      return res.status(409).json({ error: "該手機號碼已被使用。" });
    }

    // 使用 "UPDATE ... SET ? WHERE ..." 語法並使用 dataObj 和 member_id
    const sql = "UPDATE members SET ? WHERE member_id = ?";
    const [updateResult] = await db.query(sql, [dataObj, member_id]);

    console.log("updateResult.affectedRows:", updateResult.affectedRows);
    console.log("updateResult.changedRows:", updateResult.changedRows);

    if (updateResult.affectedRows === 1) {
      if (updateResult.changedRows === 0) {
        // 資料沒有變動
        return res.status(200).json({ message: "資料沒有變動" });
      } else {
        // 資料更新成功
        return res.status(200).json({ success: true });
      }
    } else {
      // 更新失敗
      return res.status(500).json({ error: "更新失敗" });
    }
  } catch (error) {
    // 資料庫更新出錯
    return res.status(500).json({ error: "資料庫更新出錯" });
  }
});

module.exports = router;

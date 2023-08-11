const express = require("express");
const db = require(__dirname + "/../modules/mysql2");
const dayjs = require("dayjs");
const router = express.Router();
const upload = require(__dirname + "/../modules/img-upload");
const multipartParser = upload.none();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

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

// 會員登入 - 0711  密碼比對
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
    "( `member_account`, `member_password`,`member_name`, `member_address`, `member_birthday`, `member_forum_name`, `member_profile`)" +
    " VALUES ( ?, ?, ?, ?, ?, null,null)";

  // function generateMemberId() {
  //   // Generate a version 4 UUID (random UUID)
  //   return uuidv4();
  // }

  // let member_id = generateMemberId();

  // 0728 讓生日格式一致
  let birthday = dayjs(req.body.member_birthday);
  if (birthday.isValid()) {
    birthday = birthday.format("YYYY-MM-DD");
  } else {
    birthday = null;
  }

  const [result] = await db.query(sql, [
    // member_id,
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

  const sql = `SELECT 
  member_id, 
  member_account, 
  member_name, 
  member_address, 
  member_phone, 
  member_birthday, 
  member_forum_name, 
  member_profile, 
  member_invoice
FROM 
  members 
WHERE 
  member_id = ?;`;

  const [rows] = await db.query(sql, [member_id]);

  if (!rows.length) {
    return res.redirect(req.baseUrl);
  }

  res.json(rows[0]);
});

//會員資料 (修改更新欄位)
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
    delete dataObj.member_id;
    delete dataObj.member_profile;
    delete dataObj.member_invoice;
    console.log(JSON.stringify(dataObj, null, 2));

    const [updateResult] = await db.query(sql, [dataObj, member_id]);

    const sql_r = "SELECT * FROM `members` WHERE member_id=? ";
    const [rows] = await db.query(sql_r, [member_id]);

    let isChanged = false;
    if (rows && rows.length) {
      for (let i in dataObj) {
        if (dataObj[i] != rows[0][i]) {
          console.log(dataObj[i]);
          console.log(rows[0][i]);
          console.log("--------------");
          isChanged = true;
        }
      }
    }
    console.log({ isChanged });
    /*
    const {
      member_account,
      member_name,
      member_address,
      member_phone,
      member_birthday,
      member_forum_name,
      member_profile,
      member_invoice,
    } = dataObj;

    const sql =
      "UPDATE `members` SET `member_account`=?,`member_name`=?,`member_address`=?,`member_phone`=?,`member_birthday`=?,`member_forum_name`=?,`member_profile`=?,`member_invoice`=? WHERE member_id = ?";

    console.log(JSON.stringify(dataObj, null, 2));

    const [updateResult] = await db.query(sql, [
      member_account,
      member_name,
      member_address,
      member_phone,
      member_birthday,
      member_forum_name,
      member_profile,
      member_invoice,
      member_id,
    ]);
*/
    console.log("updateResult.affectedRows:", updateResult.affectedRows);
    console.log("updateResult.changedRows:", updateResult.changedRows);
    console.log("updateResult.message:", updateResult);

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

//  優惠券 所有的
router.get("/allCoupons", async (req, res) => {
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

  // 自動判斷expired 並檢查是否"已使用"
  const updateSql = `UPDATE coupons_status
  SET usage_status = '已過期'
  WHERE expiration_date <= CURDATE() AND usage_status != '已使用' AND member_id = ?`;
  const [updated] = await db.query(updateSql, [member_id]);

  const sql = `
  SELECT c.coupon_name, c.coupon_value, cs.coupon_status_id, cs.usage_status, DATE_FORMAT(cs.expiration_date, '%Y/%m/%d') 
    AS expiration_date 
  FROM coupons c 
  JOIN coupons_status cs ON c.coupon_id = cs.coupon_id 
  WHERE cs.member_id=?  
  ORDER BY cs. start_date DESC`;

  const [rows] = await db.query(sql, [member_id]);

  if (!rows.length) {
    return res.redirect(req.baseUrl);
  }

  res.json(rows);
});

//  優惠券 可使用
router.get("/availableCoupons", async (req, res) => {
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

  // 自動判斷expired 並檢查是否"已使用"
  const updateSql = `UPDATE coupons_status
  SET usage_status = '已過期'
  WHERE expiration_date <= CURDATE() AND usage_status != '已使用' AND member_id = ?`;
  const [updated] = await db.query(updateSql, [member_id]);

  const sql = `SELECT c.coupon_name, c.coupon_value, cs.coupon_status_id, cs.usage_status, DATE_FORMAT(cs.expiration_date, '%Y/%m/%d') 
  AS expiration_date FROM coupons c JOIN coupons_status cs ON c.coupon_id = cs.coupon_id WHERE cs.usage_status = '未使用' AND cs.member_id=?  ORDER BY cs. start_date DESC`;
  const [rows] = await db.query(sql, [member_id]);

  if (!rows.length) {
    return res.redirect(req.baseUrl);
  }

  res.json(rows);
});

//  優惠券 已使用
router.get("/usedCoupons", async (req, res) => {
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

  // 自動判斷expired 並檢查是否"已使用"
  const updateSql = `UPDATE coupons_status
  SET usage_status = '已過期'
  WHERE expiration_date <= CURDATE() AND usage_status != '已使用' AND member_id = ?`;
  const [updated] = await db.query(updateSql, [member_id]);

  const sql = `SELECT c.coupon_name, c.coupon_value, cs.coupon_status_id, cs.usage_status, DATE_FORMAT(cs.expiration_date, '%Y/%m/%d') 
  AS expiration_date FROM coupons c JOIN coupons_status cs ON c.coupon_id = cs.coupon_id WHERE cs.usage_status = '已使用' AND cs.member_id=?  ORDER BY cs. start_date DESC`;
  const [rows] = await db.query(sql, [member_id]);

  if (!rows.length) {
    return res.redirect(req.baseUrl);
  }

  res.json(rows);
});
//  優惠券 已過期
router.get("/expiredCoupons", async (req, res) => {
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

  // 自動判斷expired 並檢查是否"已使用"
  const updateSql = `UPDATE coupons_status
  SET usage_status = '已過期'
  WHERE expiration_date <= CURDATE() AND usage_status != '已使用' AND member_id = ?`;
  const [updated] = await db.query(updateSql, [member_id]);

  const sql = `SELECT c.coupon_name, c.coupon_value, cs.coupon_status_id, cs.usage_status, DATE_FORMAT(cs.expiration_date, '%Y/%m/%d') 
  AS expiration_date FROM coupons c JOIN coupons_status cs ON c.coupon_id = cs.coupon_id WHERE cs.usage_status = '已過期' AND cs.member_id=?  ORDER BY cs. start_date DESC`;
  const [rows] = await db.query(sql, [member_id]);

  if (!rows.length) {
    return res.redirect(req.baseUrl);
  }

  res.json(rows);
});

// 護身符
router.get("/amulet", async (req, res) => {
  // let { sid } = req.params;

  // const output = {
  //   success: false,
  //   code: 0,
  //   error: "",
  // };

  // if (!res.locals.jwtData) {
  //   output.error = "沒有驗證";
  //   return res.json(output);
  // } else {
  //   output.jwtData = res.locals.jwtData; // 測試用
  // }

  // const member_id = res.locals.jwtData.id;

  const sql = `SELECT Name FROM amulet WHERE Member_ID=? `;
  const [rows] = await db.query(sql, [res.locals.jwtData.id]);

  if (!rows.length) {
    return res.redirect(req.baseUrl);
  }

  res.json(rows);
});

// 讀出照片
router.get("/profilePhoto", upload.single("preImg"), async (req, res) => {
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
  // const image = req.file.filename;
  const sql = `SELECT member_profile FROM members WHERE member_id=?`;
  const [rows] = await db.query(sql, [member_id]);
  res.json(rows[0]);
});

// //上傳照片測試 1.0
// router.post("/profilePhoto", upload.single("preImg"), async (req, res) => {
//   // const output = {
//   //   success: false,
//   //   code: 0,
//   //   error: "",
//   // };

//   // if (!res.locals.jwtData) {
//   //   output.error = "沒有驗證";
//   //   return res.json(output);
//   // } else {
//   //   output.jwtData = res.locals.jwtData; // 測試用
//   // }

//   // const member_id = res.locals.jwtData.id;
//   const image = req.file.filename;
//   const sql = "UPDATE `members` SET `member_profile`=? WHERE `member_id`=?";
//   const [rows] = await db.query(sql, [image, res.locals.jwtData.id]);
//   res.json(req.file);
// });

//上傳照片測試
router.post("/profilePhoto", upload.single("preImg"), async (req, res) => {
  // const output = {
  //   success: false,
  //   code: 0,
  //   error: "",
  // };

  // if (!res.locals.jwtData) {
  //   output.error = "沒有驗證";
  //   return res.json(output);
  // } else {
  //   output.jwtData = res.locals.jwtData; // 測試用
  // }

  const image = req.file.filename;
  const member_id = res.locals.jwtData.id;
  try {
    // 先從資料庫中查詢舊照片檔案名稱
    const selectSql = `SELECT member_profile FROM members WHERE member_id=?`;
    const [selectRows] = await db.query(selectSql, [member_id]);
    const oldFilename = selectRows[0].member_profile;

    // 刪除舊照片檔案
    if (oldFilename) {
      const oldImagePath = path.join("public", "img", oldFilename);
      fs.unlinkSync(oldImagePath);
    }

    // 更新資料庫中的照片檔案名稱
    const updateSql =
      "UPDATE `members` SET `member_profile`=? WHERE `member_id`=?";
    await db.query(updateSql, [image, member_id]);

    res.json({ success: true, message: "成功上傳新照片。" });
  } catch (error) {
    console.error("上傳照片時出錯:", error);
    res.status(500).json({ success: false, message: "上傳照片時出錯。" });
  }
});

// 照片刪除
router.delete("/profilePhoto", async (req, res) => {
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

  try {
    // 先從資料庫中查詢個人檔案照片記錄
    const selectSql = `SELECT member_profile FROM members WHERE member_id=?`;
    const [rows] = await db.query(selectSql, [member_id]);
    const filename = rows[0].member_profile;

    // 刪除資料庫中的個人檔案照片記錄
    const updateSql = `UPDATE members SET member_profile=null WHERE member_id=?`;
    await db.query(updateSql, [member_id]);

    // // 從儲存位置刪除實際的圖片檔案
    if (filename) {
      // const imagePath = path.join(__dirname, "..", "public", "img", filename);
      const imagePath = path.join("public", "img", filename);

      fs.unlinkSync(imagePath);
    }

    res.json({ success: true, message: "成功刪除個人檔案照片。" });
  } catch (error) {
    console.error("刪除個人檔案照片時出錯:", error);
    res
      .status(500)
      .json({ success: false, message: "刪除個人檔案照片時出錯。" });
  }
});

//喜好商品

router.get("/wishList", async (req, res) => {
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

  const sql = `
  SELECT p.pid, p.cid, p.image, p.product_name, p.product_price, lp.lid
  FROM products p
  JOIN like_products lp ON p.pid = lp.pid 
  WHERE lp.member_id = ?
  ORDER BY lp.created_at DESC
`;

  const [rows] = await db.query(sql, [member_id]);
  if (!rows.length) {
    return res.redirect(req.baseUrl);
  }
  // console.log(rows);
  res.json(rows);
});

//每日簽到 讀
router.get("/dailySignIn", async (req, res) => {
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

  const sql =
    "SELECT * FROM `daily_signins` WHERE member_id=? ORDER BY `daily_signins`.`signin_date` DESC LIMIT 10";

  const [rows] = await db.query(sql, [member_id]);

  if (!rows.length) {
    // If the result is empty, send the "尚未簽到記錄" message
    const output = {
      success: true,
      data: "尚未簽到記錄",
    };
    return res.json(output);
  }

  res.json(rows);
});
//每日簽到 送
router.post("/dailySignIn", multipartParser, async (req, res) => {
  const { coupon_value } = req.body;
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

  // // 檢查今天是否已經簽到
  // const checkSignInQuery =
  //   "SELECT COUNT(*) AS count FROM `daily_signins` WHERE `member_id` = ? AND DATE(`signin_date`) = CURDATE()";
  // const [checkResult] = await db.query(checkSignInQuery, [member_id]);
  // const alreadySignedIn = checkResult[0].count > 0;

  // if (alreadySignedIn) {
  //   return res.status(409).json({ error: "今天已經簽到過囉!" });
  // }

  try {
    // Get today's date
    const today = new Date();
    const startDate = today.toISOString().slice(0, 10);

    // Calculate expiration date (30 days from today)
    const expirationDate = new Date(today);
    expirationDate.setDate(expirationDate.getDate() + 30);
    const formattedExpirationDate = expirationDate.toISOString().slice(0, 10);

    // Insert into daily_signins and coupons_status in a single query
    const signInSql = `INSERT INTO daily_signins (member_id, signin_date) VALUES (?, NOW());`;
    const couponSql = `INSERT INTO coupons_status (coupon_id, member_id, usage_status, start_date, expiration_date) VALUES (?, ?, '未使用', ?, ?);`;
    // const couponSql = `INSERT INTO coupons_status (coupon_id, member_id, usage_status, start_date, expiration_date) VALUES (12, ?, '未使用', ?, ?);`;
    // const couponSql = `INSERT INTO coupons_status (coupon_id, member_id, usage_status, start_date, expiration_date) VALUES (13, ?, '未使用', ?, ?);`;

    //檢查coupon value

    switch (coupon_value) {
      case "10":
        // couponSql = `INSERT INTO coupons_status (coupon_id, member_id, usage_status, start_date, expiration_date) VALUES (1, ?, '未使用', ?, ?);`;
        coupon_id = "1";
        break;
      case "20":
        // couponSql = `INSERT INTO coupons_status (coupon_id, member_id, usage_status, start_date, expiration_date) VALUES (2, ?, '未使用', ?, ?);`;
        coupon_id = "2";
        break;
      case "30":
        coupon_id = "3";
        break;
      case "40":
        coupon_id = "4";
        break;
      case "50":
        coupon_id = "5";
        break;
      case "60":
        coupon_id = "6";
        break;
      case "70":
        coupon_id = "7";
        break;
      case "80":
        coupon_id = "8";
        break;
      case "90":
        coupon_id = "9";
        break;
      case "100":
        coupon_id = "10";
        break;
      case "1000":
        coupon_id = "11";
        break;
      // ... 其他 coupon_value 對應的寫入資料庫操作
      default:
        return res.status(400).json({ error: "無效的 coupon_value" });
    }

    const [signInResult] = await db.query(signInSql, [
      member_id, // Placeholder for member_id in daily_signins table
    ]);
    const [couponResult] = await db.query(couponSql, [
      coupon_id,
      member_id, // Placeholder for member_id in coupons_status table
      startDate,
      formattedExpirationDate,
    ]);

    // Send the response
    console.log(`signInResult:`, signInResult);
    console.log(`couponResult:`, couponResult);
    console.log(`node檢查coupon value:`, coupon_value);

    res.json({
      success: true,
      message: "簽到成功，並獲得優惠券。",
    });
  } catch (error) {
    // Handle the error
    console.error("Error executing the query:", error);
    res.status(500).json({
      success: false,
      message: "簽到失敗，請稍後再試。",
    });
  }
  // // 符合條件，可以簽到
  // const sql =
  //   "INSERT INTO `daily_signins`" +
  //   "(`member_id`,`signin_date`)" +
  //   " VALUES ( ?, now())";

  // const [result] = await db.query(sql, [member_id]);

  // res.json({
  //   result,
  //   postData: req.body,
  // });
});

module.exports = router;

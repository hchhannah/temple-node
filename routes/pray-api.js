const express = require('express');
const router = express.Router();
const db = require(__dirname+'/../modules/mysql2');

router.post('/Pray/loveB-2', async (req, res) => {
    try {
        // 從前端傳來的資料
        const requestData = req.body.requestData; 

        // 假設你的MySQL資料庫表格欄位為 All_Light 和 Datetime
        // 執行查詢
        const query = `SELECT All_Light FROM Love_Light WHERE Datetime = ?;`;
        const results = await db.query(query, [requestData]);

        // 將查詢結果回傳給前端
        res.json(results);
    } catch (error) {
        // 若有錯誤，回傳錯誤訊息給前端
        console.error(error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

// 新增一個路由來處理點選字母的資料
router.post('/Pray/loveB-2/selectLetter', async (req, res) => {
    try {
        // 從前端傳來的資料，這裡假設前端會傳遞被點選的字母
        const selectedLetter = req.body.selectedLetter; 
        const updateQuery = `UPDATE Love_Light SET Datetime = 'hot_pink' WHERE All_Light = ?;`;
        await db.query(updateQuery, [selectedLetter]);

        // 回傳成功狀態給前端
        res.json({ success: true });
    } catch (error) {
        // 若有錯誤，回傳錯誤訊息給前端
        console.error(error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

// 測試求籤
router.get("/", async (req, res) => {
    const [rows] = await db.query("SELECT * FROM `Love_Light` LIMIT 10");
    res.json(rows);
  });
  
router.POST("/mazu1", async (req, res) => {
    const [rows] = await db.query("INSERT INTO `Personal`(`Member_ID`, `Name`, `Birthday`, `Address`) VALUES (?,?,?,?)");
    res.json(rows);
  });

module.exports = router;

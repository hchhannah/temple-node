const express = require('express');
const db = require(__dirname+'/../modules/mysql2');
const dayjs = require('dayjs');
const router = express.Router();
const upload = require(__dirname + '/../modules/img-upload');
const multipartParser = upload.none();

router.get("/", async (req, res) =>{
    let output = {
        redirect : '',
        totalRows :0, 
        perPage :8, 
        totalPages :0, 
        page :1 , 
        rows :[]
    };
    const perPage = 8; //每一頁幾筆資料
    let keyword = req.query.keyword || '';
    let page = req.query.page ? parseInt(req.query.page) : 1;
    if(!page || page<1) {
        output.redirect = req.baseUrl;
        return res.json(output);
    };
    const t_sql = `SELECT COUNT(1) totalRows FROM Online_Question ${where}`;
    const [[{totalRows}]] = await db.query(t_sql);
    let totalPages = 0;
    let rows = [];
    if(totalRows){
        totalPages = Math.ceil(totalRows/perPage);
        if(page > totalPages) {
            output.redirect = req.baseUrl + '?page=' + totalPages;
            return res.json(output);
        };
        const sql = ` SELECT * FROM Online_Question ${where} LIMIT ${perPage * (page-1)}, ${perPage} `;
        [rows] = await db.query(sql);
    }
    output = {...output, totalRows, perPage, totalPages, page, rows};
    return res.json(output);
});

// 測試求籤
router.get("/", async (req, res) => {
    const [rows] = await db.query("SELECT * FROM `Love_Light` LIMIT 10");
    res.json(rows);
  });

module.exports = router;

const express = require('express');
const db = require(__dirname+'/../modules/mysql2');
const dayjs = require('dayjs');
const router = express.Router();
const upload = require(__dirname + '/../modules/img-upload');
const multipartParser = upload.none();

router.post('/mazu1', async (req,res)=>{
    console.log(req.body.requestData );
    const Member_ID = 'aaa'
 const {Name, Birthday, Address} = req.body.requestData   
const sql = "INSERT INTO `Personal`" +
"(`Member_ID`,`Name`, `Birthday`, `Address`)" +
" VALUES ( ?,?, ?, ?)";
console.log('r:',Member_ID);
const [result] = await db.query(sql,[
    Member_ID,
    Name,
    Birthday,
    Address,
])
    res.json({
        result,
        postData: req.body
    })
});
router.post('/loveA-1', async (req,res)=>{
    console.log(req.body.requestData );
    const Member_ID = 'aaa'
 const {Name, Birthday, Address,Datetime} = req.body.requestData   
const sql = "INSERT INTO `Love_redline`" +
"(`Member_ID`,`Name`, `Birthday`, `Address`,`Datetime`)" +
" VALUES ( ?,?, ?, ?,NOW())";
console.log('r:',Member_ID);
const [result] = await db.query(sql,[
    Member_ID,
    Name,
    Birthday,
    Address,
    Datetime,
])
    res.json({
        result,
        postData: req.body
    })
});
router.post('/loveB-2', async (req,res)=>{
    console.log(req.body.requestData );
    const Member_ID = '12'
//  const {Tower_ID, All_Light, LocationX,LocationY,Datetime} = req.body.requestData   
const sql = "INSERT INTO `Love_Light`" +
"(`Member_ID`,`Tower_ID`, `LocationX`,`LocationY`,`Datetime`)" +
" VALUES ( ?, ?, ?, ?, NOW())";
console.log('r:',Member_ID);
const [result] = await db.query(sql,[
    Member_ID,
    req.body.Tower_ID,
    req.body.LocationX,
    req.body.LocationY,
])
    res.json({
        result,
        postData: req.body
    })
});

router.get("/loveB-2", async (req, res) =>{
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
    const t_sql = `SELECT COUNT(1) totalRows FROM Love_Light`;
    const [[{totalRows}]] = await db.query(t_sql);
    let totalPages = 0;
    let rows = [];
    if(totalRows){
        totalPages = Math.ceil(totalRows/perPage);
        if(page > totalPages) {
            output.redirect = req.baseUrl + '?page=' + totalPages;
            return res.json(output);
        };
        const sql = ` SELECT * FROM Love_Light LIMIT ${perPage * (page-1)}, ${perPage} `;
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

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
    const All_Light = 'aaa'
//  const {Tower_ID, All_Light, LocationX,LocationY,Datetime} = req.body.requestData   
const sql = "INSERT INTO `Love_Light`" +
"(`Member_ID`,`Tower_ID`, `All_Light`, `LocationX`,`LocationY`,`Datetime`)" +
" VALUES ( ?, ?, ?, ?, ?, NOW())";
console.log('r:',Member_ID);
const [result] = await db.query(sql,[
    Member_ID,
    req.body.Tower_ID,
    All_Light,
    req.body.LocationX,
    req.body.LocationY,
])
    res.json({
        result,
        postData: req.body
    })
});
// 測試求籤
router.get("/", async (req, res) => {
    const [rows] = await db.query("SELECT * FROM `Love_Light` LIMIT 10");
    res.json(rows);
  });

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require(__dirname+'/../modules/mysql2');
const upload = require(__dirname+'/../modules/img-upload.js');
const multipartParser = upload.none();


// 商品首頁輪播熱銷TOP10
router.post('/', async (req, res) => {
    // 從前端傳來的資料
    const requestData = req.body.requestData; 
    const sql1 = `SELECT \`cid\` FROM \`categories\` WHERE \`category_name\` = ?;`
    const [cid] = await db.query( sql1, [requestData[0].id])
    const sql2 =  `SELECT * FROM \`products\` WHERE \`cid\` = ? ORDER BY \`purchase_num\` DESC LIMIT 10;`
    const [data] = await db.query(sql2,[cid[0].cid])    
    res.json(data)
  });


// 動態路由來抓資料
router.get('/:category',async (req,res)=>{
    const category = req.params.category;
    
    // 全部
    if(category==='all'){
        const [data] = await db.query(`SELECT * FROM products `)
        res.json(data)
    
    // 依照類別去抓
    }else{
        const sql1 = `SELECT \`cid\` FROM \`categories\` WHERE \`category_name\` = ?;`
        const [cid] = await db.query(sql1,[category])
        const sql2 =   `SELECT * FROM \`products\` WHERE \`cid\` = ? `
        const [data] = await db.query( sql2,[cid[0].cid])
        res.json(data)
        }

})


// 動態路由來抓資料
router.get('/:category/:pid',async (req,res)=>{
    const pid = req.params.pid;
    const sql = `SELECT \`p\`.* , \`c\`.\`category_name\` FROM \`products\` p JOIN \`categories\` c ON p.\`cid\` = c.cid WHERE p.pid=?;`
    const [data] = await db.query(sql , [pid])
    res.json(data)
})

module.exports = router;
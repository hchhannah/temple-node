const express = require('express');
const router = express.Router();
const db = require(__dirname+'/../modules/mysql2');
const upload = require(__dirname+'/../modules/img-upload.js');
const multipartParser = upload.none();

// 動態路由來抓資料
router.get('/:category',async (req,res)=>{
    const category = req.params.category;

    // 全部
    if(category==='all'){

        const [data] = await db.query(
            `SELECT * FROM products `
            )
            res.json(data)
    
    // 依照類別去抓
    }else{

        const [cid] = await db.query(
            `SELECT \`cid\` FROM \`categories\` WHERE \`category_name\` = '${category}';`
        )
                
        const [data] = await db.query(
            `SELECT p.* , c.category_name FROM \`products\` p JOIN \`categories\` c ON p.cid = c.cid WHERE p.cid = '${cid[0].cid}';`
            )
            res.json(data)
        }

})
module.exports = router;
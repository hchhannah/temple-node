const express = require('express');
const router = express.Router();
const db = require(__dirname+'/../modules/mysql2');
const upload = require(__dirname+'/../modules/img-upload.js');
const multipartParser = upload.none();


// 商品首頁輪播熱銷TOP10
router.post('/', async (req, res) => {
    // 從前端傳來的資料
    const requestData = req.body.requestData; 
    
    const [cid] = await db.query(
          `SELECT \`cid\` FROM \`categories\` WHERE \`category_name\` = '${requestData[0].id}';`
    )
    
    const [data] = await db.query(
          `SELECT * FROM \`products\` WHERE \`cid\` = ${cid[0].cid} ORDER BY \`purchase_num\` DESC LIMIT 10;`
    )
    
    res.json(data)
  });


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
            `SELECT * FROM \`products\` WHERE \`cid\` = ${cid[0].cid} `
            )
            res.json(data)
        }

})


// 動態路由來抓資料
router.get('/:category/:pid',async (req,res)=>{
    const pid = req.params.pid;
         
    const [data] = await db.query(
        `SELECT p.* , c.\`category_name\` FROM \`products\` p JOIN \`categories\` c ON p.\`cid\` = c.\`cid\` WHERE p.\`pid\`=${pid};`
        )
    res.json(data)
})

module.exports = router;
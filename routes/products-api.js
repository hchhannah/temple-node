const express = require('express');
const router = express.Router();
const db = require(__dirname+'/../modules/mysql2');
const upload = require(__dirname+'/../modules/img-upload.js');
const multipartParser = upload.none();

// fetch("localhost:3001/products/cookie")
// req.params
// /:category

// router.get('/cookies',async (req,res)=>{

//     const [data] = await db.query(
//         "SELECT * FROM `products` WHERE cid = 1"
//     )

//     res.json(data)
// })
router.get('/test',async (req,res)=>{
    res.json("test")
    // const [data] = await db.query(
    //     'SELECT * FROM products WHERE cid = 1 ORDER BY purchase_num DESC LIMIT 10;'
    // )
})


router.get('/:category',async (req,res)=>{
    const category = req.params.category;

    if(category==='all'){
        const [data] = await db.query(
            `SELECT * FROM products `
            )
            res.json(data)
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
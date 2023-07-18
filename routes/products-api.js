const express = require('express');
const router = express.Router();
const db = require(__dirname+'/../modules/mysql2');
const upload = require(__dirname+'/../modules/img-upload.js');
const multipartParser = upload.none();

// fetch("localhost:3001/products/cookie")
// req.params
// /:category

router.get('/cookies',async (req,res)=>{

    const [data] = await db.query(
        "SELECT * FROM `products` WHERE cid = 1"
    )

    res.json(data)
})
module.exports = router;
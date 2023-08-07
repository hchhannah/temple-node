const express = require('express');
const { data } = require('jquery');
const router = express.Router();
const db = require(__dirname+'/../modules/mysql2');
const upload = require(__dirname+'/../modules/img-upload.js');
const multipartParser = upload.none();

router.post('/', async (req, res) => {
    const {god} = req.body.requestData
    const sql_cid= `SELECT \`cid\` FROM \`categories\` WHERE \`category_name\` = ?`
    const [cid] = await db.query(sql_cid, [god])
    const sql = `SELECT * FROM \`worship\` WHERE \`cid\`=?`
    const [data] = await db.query(sql, [cid[0].cid])
    res.json(data)
})

module.exports = router;
const express = require('express');
const { data } = require('jquery');
const router = express.Router();
const db = require(__dirname+'/../modules/mysql2');
const upload = require(__dirname+'/../modules/img-upload.js');
const multipartParser = upload.none();
router.get('/', async (req, res) => {
    const sql_mazu = `SELECT * FROM \`worship\` WHERE \`cid\`=36`
    const [mazu_data] = await db.query(sql_mazu)
    res.json(mazu_data)
})

module.exports = router;
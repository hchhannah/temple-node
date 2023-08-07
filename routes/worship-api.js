const express = require('express');
const { data } = require('jquery');
const router = express.Router();
const db = require(__dirname+'/../modules/mysql2');
const upload = require(__dirname+'/../modules/img-upload.js');
const multipartParser = upload.none();

router.get('/', async (req, res) => {
    const sql_mazu = `SELECT * FROM \`worship\` WHERE \`cid\`=36`
    const [mazu_data] = await db.query(sql_mazu)
    const sql_love = `SELECT * FROM \`worship\` WHERE \`cid\`=37`
    const [love_data] = await db.query(sql_love)
    const sql_study = `SELECT * FROM \`worship\` WHERE \`cid\`=38`
    const [study_data] = await db.query(sql_study)
    const data =[mazu_data, love_data, study_data] 
    res.json(data)
})

module.exports = router;
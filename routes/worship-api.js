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

// 抓選取好pid
router.post('/confirm', async (req, res) => {
    const {pidArr} = req.body.requestData
    if(pidArr){
        const sql = `SELECT * FROM \`worship\` WHERE \`pid\` IN (?,?,?);`
        const [data] = await db.query(sql,[pidArr[0],pidArr[1],pidArr[2]])
        res.json(data)
    }
})

// 加入參拜資訊
router.post('/details', async (req, res) => {
    const {god, day, time, pidArr, total, status} = req.body.requestData
    const member_id = 'wayz'
    const sql_sum = `INSERT INTO \`worship_summary\`(\`member_id\`, \`god\`, \`date_time\`, \`total\`, \`status\`,\`created_at\`) VALUES (?,?,?,?,?,NOW())`
    const [data] = await db.query(sql_sum,[member_id, god, time, total, status])
    res.json(data)

    // const sql_details = `INSERT INTO \`worship_details\`(\`wid\`, \`delivery\`, \`payment\`, \`received\`, \`delivery_status\`, \`pid1\`, \`pid2\`, \`pid3\`) VALUES (?,?,?,?,?,?,?,?)`
    
    //     const sql = `SELECT * FROM \`worship\` WHERE \`pid\` IN (?,?,?);`
    //     const [data] = await db.query(sql,[pidArr[0],pidArr[1],pidArr[2]])
    //     res.json(data)
})

module.exports = router;
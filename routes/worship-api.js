const express = require('express');
const { data } = require('jquery');
const router = express.Router();
const db = require(__dirname+'/../modules/mysql2');
const upload = require(__dirname+'/../modules/img-upload.js');
const multipartParser = upload.none();

// 根據神明篩選套組產品
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
    }else{
        const sql = `SELECT * FROM \`worship\`;`
        const [data] = await db.query(sql)
        res.json(data)
    }
})

// 加入參拜資訊
router.post('/details', async (req, res) => {
    const {god, day, time, pidArr, total, complete, delivery, payment, status} = req.body.requestData
    const member_id = 'wayz'

    // summary
    const sql_sum = `INSERT INTO \`worship_summary\`(\`member_id\`, \`god\`, \`day\`, \`time\`, \`total\`, \`complete\`, \`created_at\`) VALUES (?,?,?,?,?,?,NOW())`
    const [data] = await db.query(sql_sum,[member_id, god, day, time, total, complete])

    // latest
    const sql_wid = `SELECT \`wid\` FROM \`worship_summary\` WHERE \`member_id\`=? ORDER BY \`created_at\` DESC`
    const [widArr] = await db.query(sql_wid,[member_id])
    const wid = widArr[0].wid

    // details
    const sql_details = `INSERT INTO \`worship_details\`( \`wid\`, \`delivery\`, \`payment\`, \`status\`, \`pid1\`, \`pid2\`, \`pid3\`) VALUES (?,?,?,?,?,?,?)`
    const [details] = await db.query(sql_details,[wid, delivery, payment, status, pidArr[0],pidArr[1], pidArr[2]])

    res.json('success')
})

// 參拜大綱
router.get('/summary', async (req, res) => {
    const member_id = 'wayz'
    const sql_notDone = `SELECT * FROM \`worship_summary\` WHERE \`member_id\`=? AND \`complete\`=0 ORDER BY \`day\` ASC`
    const [notDone] = await db.query(sql_notDone , [member_id])
    const sql_done = `SELECT * FROM \`worship_summary\` WHERE \`member_id\`=? AND \`complete\`=1 ORDER BY \`day\` ASC`
    const [done] = await db.query(sql_done , [member_id])
    const data = [...notDone, ...done]
    res.json(data)
})

// 參拜詳細
// router.post('/getDetails', async (req, res) => {
//     const member_id = 'wayz'
//     const sql = `SELECT * FROM \`worship_details\` WHERE \`member_id\`=? AND \`complete\`=0 ORDER BY \`day\` ASC`
//     const [data] = await db.query(sql , [member_id])
  
//     res.json(data)
// })



module.exports = router;
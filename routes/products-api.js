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
router.get('/:category/:pid', async (req, res) => {
    const pid = req.params.pid;
    const sql = `SELECT \`p\`.*, \`c\`.\`category_name\` FROM \`products\` p JOIN \`categories\` c ON p.\`cid\` = c.cid WHERE p.pid=?;`
    const [data] = await db.query(sql, [pid]);
    const datas = data.map((v) => {
        return {
            recommend: v.recommend
        };
    });
    let output = {}
    if(datas.length > 0){
        const sql2 = `SELECT * FROM \`products\` WHERE \`recommend\` = ?;`
        const [rows] = await db.query(sql2, [datas[0].recommend]);
        output = {
            data,
            rows,
        }   
    }else{
        output = {
            data,
        }   
    }
    res.json(output);
});

// 購物車內容
router.post('/cart', async (req, res) => {
    // 從前端傳來的資料(member_id(輸出內容)/pid(刪除內容))
    const { member_id, count, pid } = req.body.requestData;

    console.log('req:', member_id);
    console.log('req:', count);
    console.log('req:',  pid);
    // if(requestData.pid){
    //     const sql = `DELETE FROM \`cart\` WHERE \`pid\`=?`
    //     const [data] = await db.query(sql,[requestData.pid])
    // }
    if(pid!=null && count!=null && member_id){
        const sql = `UPDATE \`cart\` SET \`quantity\`=? WHERE \`pid\`=?`
        const [data] = await db.query(sql,[count, pid])
        res.json(data)
    }else{
        const sql = `SELECT p.* , c.quantity FROM products p JOIN cart c ON p.pid = c.pid WHERE member_id = ?;`
        const [data] = await db.query(sql,[member_id])
        // console.log(data)
        res.json(data)
    }
});

// router.delete('/:pid', async (req, res) => {
//     // 從前端傳來的資料(member_id(輸出內容)/pid(刪除內容))
//     const { pid } = req.params;
//     // const requestData = req.body.requestData;
//     // if(requestData.pid){
//     //     const sql = `DELETE FROM \`cart\` WHERE \`pid\`=?`
//     //     const [data] = await db.query(sql,[requestData.pid])
//     // }
//     // const sql = `SELECT p.* , c.quantity FROM products p JOIN cart c ON p.pid = c.pid WHERE member_id = ?;`
//     // const [data] = await db.query(sql,[requestData.member_id])
//     const sql = `DELETE FROM \`cart\` WHERE \`pid\`=?`
//     const [data] = await db.query(sql,[pid])
//     res.json(data)
// });

//加入購物車
router.post('/:category/:pid', async (req, res) => {
    const requestData = req.body.requestData;  //quantity
    const pid = req.params.pid;
    const member_id = 'wayz';
    const count = `SELECT COUNT(1) FROM \`cart\` WHERE \`pid\`=?;`
    const [result] =  await db.query(count, [pid])
    if(result[0]['COUNT(1)'] > 0 ){
        const sqlQuantity = `SELECT \`quantity\` FROM \`cart\` WHERE \`pid\` =?;`
        const [currentQuantity] = await db.query( sqlQuantity,[pid] )
        const quantity = Number(currentQuantity[0].quantity) +  Number(requestData)
        const sql =`UPDATE \`cart\` SET \`quantity\`=? WHERE \`pid\`=?;`
        const params = [quantity, pid] 
        const [data] = await db.query(sql, params)
        res.json(data)
    }else{
        const sql = `INSERT INTO \`cart\`(\`pid\`, \`quantity\`, \`member_id\`) VALUES (?,?,?)`
        const params = [pid, requestData, member_id]
        const [data] = await db.query(sql,params)
        res.json(data)
    }
})

module.exports = router;
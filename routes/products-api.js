const express = require('express');
const { data } = require('jquery');
const router = express.Router();
const db = require(__dirname+'/../modules/mysql2');
const upload = require(__dirname+'/../modules/img-upload.js');
const multipartParser = upload.none();
const currentTime = new Date();

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
        const [data] = await db.query(`SELECT * FROM \`products\` ORDER BY \`purchase_num\` DESC;`)
        res.json(data)
    
    // 依照類別去抓
    }else{
        const sql1 = `SELECT \`cid\` FROM \`categories\` WHERE \`category_name\` = ?;`
        const [cid] = await db.query(sql1,[category])
        const sql2 =   `SELECT * FROM \`products\` WHERE \`cid\` = ? ORDER BY \`purchase_num\` DESC`
        const [data] = await db.query( sql2,[cid[0].cid])
        res.json(data)
        }

})


// 動態路由來抓資料
router.get('/:category/:pid', async (req, res) => {
    const pid = req.params.pid;
    const sql = `SELECT \`p\`.*, \`c\`.\`category_name\` FROM \`products\` p JOIN \`categories\` c ON p.\`cid\` = c.cid WHERE p.pid=?;`
    const [data] = await db.query(sql, [pid]);
    // 相關推薦
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
    // 從前端傳來的資料(member_id(輸出內容)/count(更新內容)/pid(刪除內容))
    if(req.body.requestData){
        const { member_id, count, pid, id, wannaBuy} = req.body.requestData;
        console.log(req.body.requestData)
        // 購物車
        if(id===1){
            if(pid!=null && count!=null && member_id){
                // 更新數量
                const sql = `UPDATE \`cart\` SET \`quantity\`=? WHERE \`pid\`=? AND \`member_id\`=?`
                const [data] = await db.query(sql,[count, pid, member_id])
            }else if(pid!=null && count===null && member_id){
                // 刪除內容
                const sql = `DELETE FROM \`cart\` WHERE \`pid\`=? AND \`member_id\`=?`
                
                if(Array.isArray(pid)){
                    // 一鍵清空
                    for (let i = 0; i < pid.length; i++) {
                        await db.query(sql,[pid[i], member_id])        
                    }
                }else{
                    // 清除個別商品
                    const [data] = await db.query(sql,[pid, member_id])        
                }
            }

            //加入下次再買 並從購物車刪除
            if(wannaBuy){
                const sql_count= `SELECT COUNT(1) FROM \`wanna_buy\` WHERE \`pid\`=? AND \`member_id\`=?`
                const [count] = await db.query(sql_count, [pid, member_id])
                // 如果有的話更新加入時間
                if(count[0]['COUNT(1)'] > 0 ){
                    const sql = `UPDATE \`wanna_buy\` SET\`created_at\`=NOW() WHERE \`pid\`=? AND \`member_id\`=?`
                    const [rows] = await db.query(sql, [pid, member_id])
                }else{
                    const sql = `INSERT INTO \`wanna_buy\`(\`member_id\`, \`pid\`, \`created_at\`) VALUES (?,?,NOW())`
                    const [rows] = await db.query(sql, [member_id, pid])
                }
                const sql_delete = `DELETE FROM \`cart\` WHERE \`pid\`=? AND \`member_id\`=?`
                const[deleted] = await db.query(sql_delete,[pid, member_id]) 
            }
            const sql = `SELECT p.* , c.quantity FROM products p JOIN cart c ON p.pid = c.pid WHERE member_id = ?;`
            const [data] = await db.query(sql,[member_id])
            res.json(data)
            
        }else if(id===2){
            if(wannaBuy){
                const sql_delete = `DELETE FROM \`wanna_buy\` WHERE \`pid\`=? AND \`member_id\`=?`
                const[deleted] = await db.query(sql_delete,[pid, member_id]) 
            }
            //下次再買
            const sql = `SELECT p.* , w.created_at FROM products p JOIN wanna_buy w ON p.pid = w.pid WHERE \`member_id\`=? ORDER BY \`wid\` DESC;`
            const [data] = await db.query(sql, [member_id])
            res.json(data)
        }
    }else{
        // 瀏覽紀錄
        const member_id = 'wayz';
        const sql = `SELECT p.*, b.created_at FROM products p JOIN browse_history b ON p.pid = b.pid WHERE b.member_id=? ORDER BY b.created_at DESC`
        const [data] = await db.query(sql,[member_id])
        res.json(data)
    }
    
});

// Insert into cart & history
router.post('/:category/:pid', async (req, res) => {
    const requestData = req.body.requestData;  // quantity
    const pid = req.params.pid;
    const member_id = 'wayz';
    //加入購物車
    if(requestData){
        const count = `SELECT COUNT(1) FROM \`cart\` WHERE \`pid\`=? AND \`member_id\`=?;`
        const [result] =  await db.query(count, [pid, member_id])
        // const sql_wannaBuy= `SELECT COUNT(1) FROM \`wanna_buy\` WHERE \`pid\`=? AND \`member_id\`=?`
        // const [wannaBuy] = await db.query(sql_wannaBuy, [pid, member_id])
        if(result[0]['COUNT(1)'] > 0 ){
            // 如果pid已經存在只加數量
            const sqlQuantity = `SELECT \`quantity\` FROM \`cart\` WHERE \`pid\` =? AND \`member_id\`=?;`
            const [currentQuantity] = await db.query( sqlQuantity,[pid , member_id])
            const sqlStock = `SELECT \`stock_num\` FROM \`products\` WHERE \`pid\` =?;`
            const [currentStock] = await db.query( sqlStock,[pid])
            const quantity = (Number(currentQuantity[0].quantity) +  Number(requestData.quantity))>currentStock[0]['stock_num']? currentStock[0]['stock_num'] : Number(currentQuantity[0].quantity) +  Number(requestData.quantity)
       
            const sql =`UPDATE \`cart\` SET \`quantity\`=? WHERE \`pid\`=? AND \`member_id\`=?;;`
            const params = [quantity, pid, member_id] 
            const [data] = await db.query(sql, params)
            res.json(data)
        }else{
            //加入
            const sql = `INSERT INTO \`cart\`(\`pid\`, \`quantity\`, \`member_id\`) VALUES (?,?,?)`
            const params = [pid, requestData.quantity, member_id]
            const [data] = await db.query(sql,params)
            res.json(data)
        }
        if(req.body.requestData.wannaBuy){
            const sql =`DELETE FROM \`wanna_buy\` WHERE \`pid\`=? AND \`member_id\`=?`
            const [data] = await db.query(sql,[pid, member_id])
        }
    }else{
        const count = `SELECT COUNT(1) FROM \`browse_history\` WHERE \`pid\` = ? AND \`member_id\`=?`
        const [result] =  await db.query(count, [pid, member_id])
        if(result[0]['COUNT(1)'] > 0 ){
            const sql = `DELETE FROM \`browse_history\` WHERE \`pid\`=? AND \`member_id\`=?`
            const [deleted] = await db.query(sql, [pid, member_id ]) 
        }
        const sql = `INSERT INTO \`browse_history\`(\`member_id\`, \`pid\`, \`created_at\`) VALUES (?,?,NOW())`
        const [data] = await db.query(sql, [member_id , pid])
       
        res.json(data)
    }
})

module.exports = router;
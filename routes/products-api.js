const express = require('express');
const { data } = require('jquery');
const router = express.Router();
const db = require(__dirname+'/../modules/mysql2');
const upload = require(__dirname+'/../modules/img-upload.js');
const multipartParser = upload.none();
// get(render) put(update) delete post

// 商品首頁輪播熱銷TOP10
router.post('/', async (req, res) => {
    // 從前端傳來的資料
    const requestData = req.body.requestData; 
    // 找出類別
    const sql1 = `SELECT \`cid\` FROM \`categories\` WHERE \`category_name\` = ?;`
    const [cid] = await db.query( sql1, [requestData[0].id])
    // 根據類別篩出購買量最高的前10 
    const sql2 =  `SELECT * FROM \`products\` WHERE \`cid\` = ? ORDER BY \`purchase_num\` DESC LIMIT 10;`
    const [data] = await db.query(sql2,[cid[0].cid])    
    res.json(data)
});

// 瀏覽紀錄
router.get('/history', async (req, res) => {
    const member_id = 'wayz';
    const sql = `SELECT p.*, b.created_at FROM products p JOIN browse_history b ON p.pid = b.pid WHERE b.member_id=? ORDER BY b.created_at DESC`
    const [data] = await db.query(sql,[member_id])
    const sql_keep = `SELECT * 
    FROM (
        SELECT * 
        FROM browse_history 
        WHERE member_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    ) AS subquery;
    `
    const [keep] = await db.query(sql_keep,[member_id])

    const sql_deleted = `DELETE FROM browse_history 
    WHERE member_id =?
    AND created_at NOT IN (
        SELECT created_at 
        FROM (
            SELECT created_at 
            FROM browse_history 
            WHERE member_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        ) AS subquery
    );`
    
    const [deleted] = await db.query(sql_deleted,[member_id, member_id])
    res.json(data)
})

// 加入瀏覽紀錄
router.post('/history', async (req, res) => {
    const member_id = 'wayz';
    const {pid} = req.body.requestData
     // 如果本來就存在了就刪掉舊的加入新的，沒有就直接加入
     const sql_count = `SELECT COUNT(1) FROM \`browse_history\` WHERE \`pid\` = ? AND \`member_id\`=?`
     const [count] =  await db.query(sql_count, [pid, member_id])
     //刪除舊的
     if(count[0]['COUNT(1)'] > 0 ){
         const sql = `DELETE FROM \`browse_history\` WHERE \`pid\`=? AND \`member_id\`=?`
         const [deleted] = await db.query(sql, [pid, member_id ]) 
     }
     //加入新的
     const sql = `INSERT INTO \`browse_history\`(\`member_id\`, \`pid\`, \`created_at\`) VALUES (?,?,NOW())`
     const [data] = await db.query(sql, [member_id , pid])
    
     res.json(data)
})

// navbar購物車資料
router.get('/count', async (req, res) => {
    const member_id = 'wayz'
    const sql = `SELECT COUNT(1) FROM \`cart\` WHERE \`member_id\`=?`
    const [data] = await db.query(sql, [member_id])
    res.json(data[0]['COUNT(1)'])
});
  

// 刪除喜好商品
router.get('/favoriteMatch', async (req, res) => {
    const member_id = 'wayz';
    // const {pid} = req.body.requestData;  
    const sql = `SELECT * FROM \`like_products\` WHERE \`member_id\`=?`
    const [data] = await db.query(sql,[member_id])
    const pidArr = data.map((v,i)=>{
        return {pid: v.pid}
    })
    res.json(pidArr)
})


// 購物車內容
router.get('/cart',async(req,res)=>{
    const member_id = 'wayz'
    const sql = `SELECT p.* , c.quantity FROM products p JOIN cart c ON p.pid = c.pid WHERE member_id = ? ORDER BY c.created_at DESC;`
    const [data] = await db.query(sql,[member_id])
    res.json(data)
})

// 下次再買內容
router.get('/wannaBuy',async(req,res)=>{
    const member_id = 'wayz'
    const sql = `SELECT p.* , w.created_at FROM products p JOIN wanna_buy w ON p.pid = w.pid WHERE \`member_id\`=? ORDER BY \`wid\` DESC;`
    const [data] = await db.query(sql, [member_id])
    res.json(data)
})

// 加入購物車
router.post('/cart', async (req, res) => {
    const member_id = 'wayz';
    const {count, pid , wannaBuy} = req.body.requestData;  
    
    // 判斷有沒有在購物車裡
    const sql_count = `SELECT COUNT(1) FROM \`cart\` WHERE \`pid\`=? AND \`member_id\`=?;`
    const [result] =  await db.query(sql_count, [pid, member_id])
    if(result[0]['COUNT(1)'] > 0 ){
        // 如果pid已經存在只加數量(找出原本的quantity並和requestData相加)
        const sql_quantity = `SELECT \`quantity\` FROM \`cart\` WHERE \`pid\` =? AND \`member_id\`=?;`
        const [currentQuantity] = await db.query( sql_quantity,[pid , member_id])
        // 抓庫存
        const sql_stock = `SELECT \`stock_num\` FROM \`products\` WHERE \`pid\` =?;`
        const [currentStock] = await db.query( sql_stock,[pid])
        // 不能大於庫存量
        const quantity = (Number(currentQuantity[0].quantity) +  Number(count))>currentStock[0]['stock_num']? currentStock[0]['stock_num'] : Number(currentQuantity[0].quantity) +  Number(count)
        // 更新quantity資料
        const sql = `UPDATE \`cart\` SET \`quantity\`=?,\`created_at\`=NOW() WHERE \`pid\`=? AND \`member_id\`=?`;
      
        const params = [quantity, pid, member_id];
      
        const [data] = await db.query(sql, params)
        res.json(data)
    }else{
        // 此商品本來不在購物車的話加入購物車
        const sql = `INSERT INTO \`cart\`(\`pid\`, \`quantity\`, \`member_id\`,\`created_at\`) VALUES (?,?,?,NOW())`
        const params = [pid, count, member_id]
        const [data] = await db.query(sql,params)
        res.json(data)
    }
    // 如果是從下次再買按加入購物車的話把他從下次再買刪除
    if(wannaBuy){
        const sql =`DELETE FROM \`wanna_buy\` WHERE \`pid\`=? AND \`member_id\`=?`
        const [data] = await db.query(sql,[pid, member_id])
    }
})

// 加入喜好商品
router.post('/favorite', async (req, res) => {
    const member_id = 'wayz';
    const {pid} = req.body.requestData;  
    
    const sql = `INSERT INTO \`like_products\`(\`member_id\`, \`pid\`, \`created_at\`) VALUES (?,?,NOW())`
    const [data] = await db.query(sql,[member_id, pid])

    res.json(data)
})

//加入下次再買
router.post('/wannaBuy', async (req, res) => {
    const member_id = 'wayz'
    const {pid} = req.body.requestData;
    // 判斷下次再買了有沒有這筆商品 
    const sql_count= `SELECT COUNT(1) FROM \`wanna_buy\` WHERE \`pid\`=? AND \`member_id\`=?`
    const [count] = await db.query(sql_count, [pid, member_id])

    if(count[0]['COUNT(1)'] > 0 ){
        // 如果有的話更新加入時間
        const sql = `UPDATE \`wanna_buy\` SET\`created_at\`=NOW() WHERE \`pid\`=? AND \`member_id\`=?`
        const [rows] = await db.query(sql, [pid, member_id])
    }else{
        // 如果沒有的話加入
        const sql = `INSERT INTO \`wanna_buy\`(\`member_id\`, \`pid\`, \`created_at\`) VALUES (?,?,NOW())`
        const [rows] = await db.query(sql, [member_id, pid])
    }
    const sql_delete = `DELETE FROM \`cart\` WHERE \`pid\`=? AND \`member_id\`=?`
    const[deleted] = await db.query(sql_delete,[pid, member_id])
    res.json(deleted)
})

// 更新購物車數量
router.put('/cart', async(req,res)=>{
    const member_id = 'wayz'
    const {count, pid} = req.body.requestData;
    // 更新數量
    const sql = `UPDATE \`cart\` SET \`quantity\`=? WHERE \`pid\`=? AND \`member_id\`=?`
    const [data] = await db.query(sql,[count, pid, member_id])
    res.json(data)
})

// 從購物車刪除
router.delete('/cart', async(req,res)=>{
    const member_id = 'wayz'
    const {pid} = req.body.requestData;
    const sql = `DELETE FROM \`cart\` WHERE \`pid\`=? AND \`member_id\`=?`
    if(Array.isArray(pid)){
        // 一鍵清空
        for (let i = 0; i < pid.length; i++) {
            const [data] = await db.query(sql,[pid[i], member_id])        
        }
    }else{
        // 清除個別商品
        const [data] = await db.query(sql,[pid, member_id])        
    }
    res.json(pid)

})

// 刪除喜好商品
router.delete('/favorite', async (req, res) => {
    const member_id = 'wayz';
    const {pid} = req.body.requestData;  
    
    const sql = `DELETE FROM \`like_products\` WHERE \`pid\`=? AND \`member_id\`=?`
    const [data] = await db.query(sql,[pid, member_id])

    res.json(data)
})

// 從下次再買刪除
router.delete('/wannaBuy', async(req,res)=>{
    const member_id = 'wayz'
    const {pid} = req.body.requestData;
    const sql_delete = `DELETE FROM \`wanna_buy\` WHERE \`pid\`=? AND \`member_id\`=?`
    const[deleted] = await db.query(sql_delete,[pid, member_id]) 
    res.json(deleted)
})

//訂單summary資料
router.get('/order', async(req,res)=>{
    const member_id = 'wayz'
    const sql = `SELECT * FROM \`order_summary\` WHERE \`member_id\`=? ORDER BY \`created_at\` DESC`
    const [data] = await db.query(sql, [member_id])
    res.json(data)
})

// 送出訂單更改庫存量 / 購買量
router.put('/order', async(req,res)=>{
    const {cartData} = req.body.requestData;
    const details = cartData.map((v)=>{
        return  { quantity: v.quantity, pid: v.pid }
    })
    const sql = `UPDATE \`products\` SET \`purchase_num\`=\`purchase_num\`+?,\`stock_num\`=\`stock_num\`-? WHERE \`pid\` =?`

    Promise.all(
        details.map(async (v)=>{
            const quantity = Number(v.quantity) 
            const[data] = await db.query(sql, [quantity,quantity,v.pid])
        })
    )

    res.json('success')
})

// 送出訂單
router.post('/order',async(req,res)=>{
    const member_id = 'wayz'
    const {cartData, customerData, total, status} = req.body.requestData;

    // for order_summary
    const{customer_name, customer_phone, customer_email, customer_address, payment, delivery, invoice, coupon} = customerData
    // Insert into order_summary
    const sql_ord = `INSERT INTO \`order_summary\`(\`oid\`, \`member_id\`, \`total\`, \`customer_name\`, \`customer_email\`, \`customer_phone\`, \`customer_address\`, \`payment\`, \`delivery\`, \`invoice\`, \`coupon\`, \`created_at\`, \`status\`) VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),?)`
    // timestamp 當訂單編號
    const timestamp = new Date().getTime().toString();
    const [ord] = await db.query(sql_ord,[timestamp, member_id, total, customer_name, customer_email, customer_phone, customer_address, payment, delivery, invoice, coupon, status])
    
    // Insert into order_details
    const sql_ordDetails = `INSERT INTO \`order_details\`( \`oid\`, \`quantity\`, \`pid\`, \`product_price\`) VALUES (?,?,?,?)`
    const order_details = cartData.map((v)=>{
        return  { quantity: v.quantity, pid: v.pid, product_price: v.product_price }
    })
    Promise.all(
        order_details.map(async (v)=>{
            const [ordDetails] = await db.query(sql_ordDetails,[timestamp, v.quantity, v.pid, v.product_price])
        })
    )

    // 刪除購物車裡結帳的商品
    const pidArray = cartData?.map((v,i)=>{
        return cartData[i].pid
    })
    const sql_deleted = 'DELETE FROM cart WHERE pid IN (?) AND member_id = ?';
    const [deleted] = await db.query(sql_deleted, [pidArray, member_id]);
    res.json(ord)

})

//訂單details資料
router.get('/orderDetails', async(req,res)=>{
    const member_id = 'wayz'
    // 訂單編號
    const sql_oid = `SELECT \`oid\` FROM \`order_summary\` WHERE \`member_id\` = ? ORDER BY \`created_at\` DESC`
    const [oid] = await db.query(sql_oid,[member_id])
    // 根據訂單編號去篩選產品資料
    // 根據pid篩選product_name, image
    const sql = `SELECT \`o\`.*, \`p\`.\`product_name\`, \`p\`.\`image\` FROM \`order_details\` o JOIN \`products\` p ON o.\`pid\` = p.pid WHERE o.oid=?;`
    const [data] = await db.query(sql, [oid[0].oid])
    
    res.json(data)
})

// 動態路由來抓類別資料
router.post('/:category',async (req,res)=>{
    const category = req.params.category
    const {page, perPage, sort, orderBy, keyword} = req.body.requestData;
    let totalPages = 0
    let where = 'WHERE 1'
    
    // 依照類別去改變WHERE條件
    if(category!=='all'){
        const sql_cid = `SELECT \`cid\` FROM \`categories\` WHERE \`category_name\` = ?;`
        const [cid] = await db.query(sql_cid,[category])
        where = `WHERE \`cid\` = ${cid[0]['cid']}`
    }
   
    if(keyword) {
        const kw_escaped = db.escape('%'+keyword+'%');
        where += ` AND ( 
        \`product_name\` LIKE ${kw_escaped} 
        )
        `;
    }
        
    // totalRows (總共幾筆)
    const sql_totalRows =   `SELECT COUNT(1) FROM \`products\` ${where}`
    const [totalRows] = await db.query(sql_totalRows);

    // 有抓到資料的話
    if(totalRows[0]['COUNT(1)']){
        // totalPages (總頁數) = totalRows (總共幾筆) / perPage (一頁幾筆)
        totalPages = Math.ceil(totalRows[0]['COUNT(1)']/perPage);

        // 如果大於總頁數或是小於第一頁重新導向
        let redirect = {}
        if (!page || page < 1) {
            redirect.redirect = `${req.baseUrl}/${category}?page=1`;
            return res.json(redirect);
          }
        if (page > totalPages) {
            redirect.redirect = `${req.baseUrl}/${category}?page=${totalPages}`;
            return res.json(redirect);
          }
       
        // SELECT 商品資料
        const sql =   `SELECT * FROM \`products\` ${where} ORDER BY ${orderBy} ${sort}  LIMIT ${perPage*(page-1)}, ${perPage}`
        const [data] = await db.query(sql)
        
        const pagination = {                
            page: page,
            totalPages: totalPages,
        }
        const success ={success: totalRows[0]['COUNT(1)']}
        let output = {data, pagination, success} 
        res.json(output)
    }else{
        const output = {success:0}
        res.json(output)
    }
    
    
})

// 動態路由來抓商品詳細資料
router.get('/:category/:pid', async (req, res) => {
    const pid = req.params.pid;

    //抓出個別項目的products資料和對應的category name
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
        const sql2 = `SELECT * FROM \`products\` WHERE \`recommend\` = ? AND \`pid\` <> ?;`
        const [related] = await db.query(sql2, [datas[0].recommend, pid]);
        output = {
            data,
            related,
        }   
    }else{
        output = {
            data,
        }   
    }
    res.json(output);
});

// 動態路由瀏覽量加一
router.put('/:category/:pid', async (req, res) => {
    const pid = req.params.pid;
    console.log(pid);
    const sql = `UPDATE \`products\` SET \`browse_num\` = \`browse_num\`+1 WHERE \`pid\` =?`
    const [data] = await db.query(sql, [pid])
    res.json(data)
})
module.exports = router;
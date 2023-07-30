const express = require('express');
const { data } = require('jquery');
const router = express.Router();
const db = require(__dirname+'/../modules/mysql2');
const upload = require(__dirname+'/../modules/img-upload.js');
const multipartParser = upload.none();

// get(render) put(update) delete post


// const getListData = async (req)=>{
//     let output = {
//       redirect: '',
//       totalRows:0, 
//       perPage: 25, 
//       totalPages: 0, 
//       page: 1,
//       rows: []
//     }
//     const perPage = 25;
//     let keyword = req.query.keyword || '';
//     let page = req.query.page ? parseInt(req.query.page) : 1;
//     if(!page || page<1) {
//       output.redirect = req.baseUrl;
//       return output;
//     };
  
//     let where = ' WHERE 1 ';
//     if(keyword) {
//       const kw_escaped = db.escape('%'+keyword+'%');
//       where += ` AND ( 
//         \`name\` LIKE ${kw_escaped} 
//         OR
//         \`address\` LIKE ${kw_escaped}
//         )
//       `;
//     }
  
//     const t_sql = `SELECT COUNT(1) totalRows FROM address_book ${where}`;
//     const [[{totalRows}]] = await db.query(t_sql);
//     let totalPages = 0;
//     let rows = [];
//     if(totalRows){
//       totalPages = Math.ceil(totalRows/perPage);
//       if(page > totalPages) {
//         output.redirect = req.baseUrl + '?page=' + totalPages;
//         return output;
//       };
//       const sql = ` SELECT * FROM address_book ${where} LIMIT ${perPage*(page-1)}, ${perPage}`;
//       [rows] = await db.query(sql);
      
//     }
//     output = {...output, totalRows, perPage, totalPages, page, rows, keyword};
//     return output;
//   }

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
    res.json(data)
})

// 加入瀏覽紀錄
router.post('/history', async (req, res) => {
    const member_id = 'wayz';
    const {pid} = req.body.requestData
    console.log(pid)
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
  
// 購物車內容
router.get('/cart',async(req,res)=>{
    const member_id = 'wayz'
    const sql = `SELECT p.* , c.quantity FROM products p JOIN cart c ON p.pid = c.pid WHERE member_id = ?;`
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
        const sql =`UPDATE \`cart\` SET \`quantity\`=? WHERE \`pid\`=? AND \`member_id\`=?;`
        const params = [quantity, pid, member_id] 
        const [data] = await db.query(sql, params)
        res.json(data)
    }else{
        // 此商品本來不在購物車的話加入購物車
        const sql = `INSERT INTO \`cart\`(\`pid\`, \`quantity\`, \`member_id\`) VALUES (?,?,?)`
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

// 從下次再買刪除
router.delete('/wannaBuy', async(req,res)=>{
    const member_id = 'wayz'
    const {pid} = req.body.requestData;
    const sql_delete = `DELETE FROM \`wanna_buy\` WHERE \`pid\`=? AND \`member_id\`=?`
    const[deleted] = await db.query(sql_delete,[pid, member_id]) 
    res.json(deleted)
})

// 動態路由來抓類別資料
router.get('/:category',async (req,res)=>{
    const category = req.params.category;
    let totalPages = 0
    let perPage = 25
    let page = req.query.page ? parseInt(req.query.page) : 1;
    console.log(page);
    console.log(req.query.keyword);
    // 全部
    if(category==='all'){
        const [data] = await db.query(`SELECT * FROM \`products\` ORDER BY \`purchase_num\` DESC LIMIT 25;`)
        res.json(data)
    
    // 依照類別去抓
    }else{
        const sql_cid = `SELECT \`cid\` FROM \`categories\` WHERE \`category_name\` = ?;`
        const [cid] = await db.query(sql_cid,[category])
        const sql_totalRows =   `SELECT COUNT(1) FROM \`products\` WHERE \`cid\` = ?`
        const [[{totalRows}]] = await db.query(sql_totalRows,[cid[0]['cid']]);

        // if(totalRows){
            // totalPages = Math.ceil(totalRows/perPage);
            // if(page > totalPages) {
            //   output.redirect = req.baseUrl + '?page=' + totalPages;
            //   return output;
            // };
            // const sql = ` SELECT * FROM address_book ${where} LIMIT ${perPage*(page-1)}, ${perPage}`;
            // [rows] = await db.query(sql);
        const sql =   `SELECT * FROM \`products\` WHERE \`cid\` = ? ORDER BY \`purchase_num\` DESC  LIMIT ${perPage*(page-1)}, 25`
        const [data] = await db.query( sql,[cid[0]['cid']])
        res.json(data)
        // }

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
        const sql2 = `SELECT * FROM \`products\` WHERE \`recommend\` = ?;`
        const [related] = await db.query(sql2, [datas[0].recommend]);
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


module.exports = router;
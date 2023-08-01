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
router.post('/:category',async (req,res)=>{
    const category = req.params.category
    const page = req.params.page
    const {perPage, sort, orderBy} = req.body.requestData;
    let totalPages = 0
    let where = 'WHERE 1'
    // purchase_num 熱銷 
    // product_price 價錢
    // stars 星星
    // recommed 詳細類別
    
    // 依照類別去改變WHERE條件
    if(category!=='all'){
        const sql_cid = `SELECT \`cid\` FROM \`categories\` WHERE \`category_name\` = ?;`
        const [cid] = await db.query(sql_cid,[category])
        where = `WHERE \`cid\` = ${cid[0]['cid']}`
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
        let output = {data, pagination} 
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


module.exports = router;
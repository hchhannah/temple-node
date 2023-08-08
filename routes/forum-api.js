const express = require('express');
const db = require(__dirname+'/../modules/mysql2');
const dayjs = require('dayjs');
const router = express.Router();
const upload = require(__dirname + '/../modules/img-upload');
const multipartParser = upload.none();

router.get("/", async (req, res) =>{
    let output = {
        redirect : '',
        totalRows :0, 
        perPage :6, 
        totalPages :0, 
        page :1 , 
        rows :[]
    };
    const perPage = 6;
    let keyword = req.query.keyword || '';
    let page = req.query.page ? parseInt(req.query.page) : 1;
    if(!page || page<1) {
        output.redirect = req.baseUrl;
        return res.json(output);
    };

    //關鍵字搜尋
    let where = 'WHERE 1';
    // let keyword = req.query.keyword || '';
    if(keyword) {
        const kw_escaped = db.escape('%'+keyword+'%')
        where += ` AND (
        \`title\` LIKE ${ kw_escaped } 
        OR
        \`content\` LIKE ${ kw_escaped }
        )
        `;
    }

    // where += " AND `post_category` = '1'";
    const t_sql = `SELECT COUNT(1) totalRows FROM post ${where}`;
    const [[{totalRows}]] = await db.query(t_sql);
    let totalPages = 0;
    let rows = [];
    if(totalRows){
        totalPages = Math.ceil(totalRows/perPage);
        if(page > totalPages) {
            output.redirect = req.baseUrl + '?page=' + totalPages;
            return res.json(output);
        };
        const sql = ` SELECT * FROM post ${where} LIMIT ${perPage * (page-1)}, ${perPage} `;
        [rows] = await db.query(sql);
        rows.forEach(i => {
            i.publish_time = dayjs(i.publish_time).format('YYYY-MM-DD-HH:mm:ss');
        });
    }
    output = {...output, totalRows, perPage, totalPages, page, rows};
    return res.json(output);
    // res.json({totalRows, perPage, totalPages, page, rows});
});


//抓單筆貼文
router.get("/:category/:post_sid", async(req, res)=>{

    const output = {
        success: false,
        error:"",
        row:null
    };
    const post_sid = parseInt(req.params.post_sid) || 0;
    console.log(post_sid)
    if(! post_sid){
    //沒有sid
    output.error = '沒有 sid !';
        } else {
        const sql = `SELECT * FROM post WHERE sid=?`;
        const [rows] = await db.query(sql,[post_sid]);
        rows.forEach(i => {
            i.publish_time = dayjs(i.publish_time).format('YYYY-MM-DD-HH:mm:ss');
        });
        if(rows.length){
        output.success = true;
        output.row = rows[0];
        } else {
    //沒有資料
            output.error = '沒有資料 !';
        }
        
    }
    res.json(output);

    });
    
router.use((req, res, next)=>{
    res.locals.title = '八卦版' + res.locals.title;
    next();
});

router.get('/api', async(req, res)=>{
    const output = await getListData(req);
    output.rows.forEach(i=>{
    i.publish_time =dayjs(i.publish_time).format('YYYY-MM-DD-HH-mm-ss');
});
res.json(output);

});

//抓各版貼文
router.post('/:category', async (req, res) => {
    const postCategory = req.params.category;
    console.log(req.body.page);
    const info = [
        {
        text: '八卦版',
        id: 'gossip',
    },
        {
        text: '愛情版',
        id: 'love',
        
    },
        {
        text: '鬼故事版',
        id: 'ghost',
    },
        {
        text: '籤詩版',
        id: 'fortunesticks',
    },
]   
    const sid = info.findIndex((v)=>v.id===postCategory)
    
    const sql = ` SELECT p.*, c.type_name 
    FROM post p 
    JOIN postcategory c ON p.postcategory_sid = c.sid 
    WHERE p.postcategory_sid = ? 
    LIMIT ?, ?`

    const perPage = 6;
    const page = req.body.page || 1;
    const offset = (page - 1) * perPage;
    const [data] = await db.query(sql,[sid+1,offset,perPage])

    const [totalRows] = await db.query('SELECT COUNT(*) as totalRows FROM post WHERE postcategory_sid = ?', [sid+1]);
    const totalPages = Math.ceil(totalRows[0].totalRows / perPage);
    const output  = [data, {totalPages: totalPages}] 
    res.json(output)
});
    // if (!postCategory) {
    //   return res.status(400).json({ error: 'Missing postcategory_sid parameter' });
    // }
  
    // try {
    //   const connection = await pool.getConnection();
    //   const query = `
    //     SELECT p.*, c.type_name 
    //     FROM post p 
    //     JOIN postcategory c ON p.postcategory_sid = c.sid 
    //     WHERE p.postcategory_sid = ? 
    //     LIMIT ?, ?
    //   `;
    //   const perPage = 6;
    //   const page = req.query.page || 1;
    //   const offset = (page - 1) * perPage;
  
    //   const [rows] = await connection.query(query, [postCategory, offset, perPage]);
    //   connection.release();
  
    //   const [totalRows] = await connection.query('SELECT COUNT(*) as totalRows FROM post WHERE postcategory_sid = ?', [postCategory]);
    //   const totalPages = Math.ceil(totalRows[0].totalRows / perPage);
  
    //   res.json({
    //     totalRows: totalRows[0].totalRows,
    //     perPage: perPage,
    //     totalPages: totalPages,
    //     page: parseInt(page),
    //     rows: rows,
    //   });
    // } catch (error) {
    //   console.error('Error executing SQL query:', error);
    //   res.status(500).json({ error: 'Internal Server Error' });
    // }
  
  

// 取得單筆資料的api
// router.get('/api/:sid', async(req, res)=>{
//     const output = {
//         success : false,
//         error : '',
//         data : null,
//     }
//     const sid = parseInt(req.params.sid) || 0;
//     if(! sid){
//         output.error = '錯誤的id'
//         return res.json(output);
//     }

//     const sql = `SELECT * FROM post WHERE sid=${sid}`;
//     const [rows] = await db.query(sql);
//     if (!rows.length){
//         output.error = '沒有資料'
//         return res.json(output);
//     }
//     rows[0].publish_time =dayjs(rows[0].publish_time).format('YYYY-MM-DD-HH-mm-ss');
//     output.success = true;
//     output.data = rows[0];
//     const output = await getListData(req);
//     output.rows.forEach(i=>{
//     i.publish_time =dayjs(i.publish_time).format('YYYY-MM-DD-HH-mm-ss');
// });
// res.json(output);

// });

//呈現新增資料的表單
// router.get('/add', async(req, res)=>{

// res.json(output);

// });

// 新增資料的功能
// router.post('/', upload.none() , async (req,res)=>{
// const sql = "INSERT INTO `post`" +
// "(`member_forum_name`, `title`, `content`, `publish_time`, `postcategory_sid`)" +
// " VALUES (?, ?, ?, NOW(), ?)";

// const [result] = await db.query(sql,[
//     req.body.member_forum_name,
//     req.body.title,
//     req.body.content,
//     req.body.postcategory_sid,
// ])
//     res.json({
//         result,
//         postData: req.body
//     })
// });

//刪除
// router.delete('/:sid',async(req, res)=>{
//     const { sid } = req.params;

//     const sql = `DELETE FROM post WHERE sid =?`;
//     const [result] = await db.query(sql, [sid]);

//     res.json({...result, sid});
// });

module.exports = router;
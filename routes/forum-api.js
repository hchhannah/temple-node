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
    if(keyword) {
        const kw_escaped = db.escape('%'+keyword+'%')
        where += ` AND (
        \`title\` LIKE ${ kw_escaped } 
        OR
        \`content\` LIKE ${ kw_escaped }
        )
        `;
    }

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
// router.use((req, res, next)=>{
//     res.locals.title = '八卦版' + res.locals.title;
//     next();
// });

// router.get('/api', async(req, res)=>{
//     const output = await getListData(req);
//     output.rows.forEach(i=>{
//     i.publish_time =dayjs(i.publish_time).format('YYYY-MM-DD-HH-mm-ss');
// });
// res.json(output);

// });

//取得單筆資料的api
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
    // const output = await getListData(req);
    // output.rows.forEach(i=>{
    // i.publish_time =dayjs(i.publish_time).format('YYYY-MM-DD-HH-mm-ss');
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
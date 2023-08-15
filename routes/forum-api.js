const express = require('express');
const db = require(__dirname+'/../modules/mysql2');
const dayjs = require('dayjs');
const router = express.Router();
const upload = require(__dirname + '/../modules/img-upload');
const multipartParser = upload.none();


// //keyword search
// router.post('/:category', async (req, res) => {
//     const postCategory = req.params.category;
//     const member_id = '1';
//     const info = [
//       {
//         text: '八卦版',
//         id: 'gossip',
//       },
//       {
//         text: '愛情版',
//         id: 'love',
//       },
//       {
//         text: '鬼故事版',
//         id: 'ghost',
//       },
//       {
//         text: '籤詩版',
//         id: 'fortunesticks',
//       },
//     ];
//     const sid = info.findIndex((v) => v.id === postCategory);
    
//     // 關鍵字搜尋相關
//     const keyword = req.query.keyword || ''; // 從請求中獲取關鍵字
//     let where = 'WHERE p.postcategory_sid = ?';

//     if (keyword) {
//       const kw_escaped = db.escape('%' + keyword + '%');
//       where += ` AND (
//         \`title\` LIKE ${kw_escaped}
//         OR
//         \`content\` LIKE ${kw_escaped}
//       )`;
//     }
  
//     const sql = `SELECT p.*, c.type_name 
//       FROM post p 
//       JOIN postcategory c ON p.postcategory_sid = c.sid 
//       ${where}  
//       LIMIT ?, ?`;
  
//     const perPage = 6;
//     const page = req.body.page || 1;
//     const offset = (page - 1) * perPage;
  
//     try {
//       // 執行 SQL 查詢
//       const [data] = await db.query(sql, [sid + 1, offset, perPage]);
//       data.forEach((i) => {
//         i.publish_time = dayjs(i.publish_time).format('YYYY-MM-DD-HH:mm:ss');
//       });
  
//       const [[{ totalRows }]] = await db.query(
//         `SELECT COUNT(*) as totalRows FROM post WHERE postcategory_sid = ? `,
//         [sid + 1]
//       );
//       const totalPages = Math.ceil(totalRows / perPage);
  
//       const sql_good = `SELECT * FROM \`good\` WHERE \`member_id\`=?`;
//       const [good] = await db.query(sql_good, [member_id]);
  
//       const sql_collect = `SELECT * FROM \`postcollect\` WHERE \`member_id\`=?`;
//       const [collect] = await db.query(sql_collect, [member_id]);
  
//       const output = [data, { totalPages: totalPages }, good, collect];
//       res.json(output);
//     } catch (error) {
//       console.error('An error occurred:', error);
//       res.json({
//         success: false,
//         error: '發生錯誤!',
//       });
//     }
//   });

    
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

//按讚
router.post('/good', async (req,res)=>{
    const {sid} = req.body.requestData
    const member_id = res.locals.jwtData.id
    const sql_insert = `INSERT INTO \`good\`(\`post_sid\`, \`member_id\`) VALUES (?,?)`
    const [data] = await db.query(sql_insert, [sid, member_id])
    const sql_update = `UPDATE \`post\` SET \`good\`=\`good\`+1 WHERE \`sid\`=?`
    const [rows] =await db.query(sql_update,[sid])
    res.json(data)
}) 

//收回讚
router.delete('/good', async (req,res)=>{
    const {sid} = req.body.requestData
    const member_id = res.locals.jwtData.id
    const sql = `DELETE FROM \`good\` WHERE \`post_sid\`=? AND \`member_id\`= ?`
    const [data] = await db.query(sql, [sid, member_id])
    const sql_update = `UPDATE \`post\` SET \`good\`=\`good\`-1 WHERE \`sid\`=?`
    const [rows] =await db.query(sql_update,[sid])
    res.json(data)
}) 

//珍藏
router.post('/collect', async (req,res)=>{
    const {sid} = req.body.requestData
    const member_id = res.locals.jwtData.id
    const sql_insert = `INSERT INTO \`postcollect\`( \`post_sid\`, \`member_id\`) VALUES (?,?)`
    const [data] = await db.query(sql_insert, [sid, member_id])
    // const sql_update = `UPDATE \`post\` SET \`good\`=\`good\`+1 WHERE \`sid\`=?`
    // const [rows] =await db.query(sql_update,[sid])
    res.json(data)
}) 

//取消珍藏
router.delete('/collect', async (req,res)=>{
    const {sid} = req.body.requestData
    const member_id = res.locals.jwtData.id
    const sql = `DELETE FROM \`postcollect\` WHERE \`post_sid\`=? AND \`member_id\`=?`
    const [data] = await db.query(sql, [sid, member_id])
    // const sql_update = `UPDATE \`post\` SET \`good\`=\`good\`-1 WHERE \`sid\`=?`
    // const [rows] =await db.query(sql_update,[sid])
    res.json(data)
}) 

//抓各版貼文
router.post('/:category', async (req, res) => {
    const postCategory = req.params.category;
    const member_id = res.locals.jwtData.id;
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
    
    // 關鍵字搜尋相關
    // let keyword = req.query.keyword || ''; // 從請求中獲取關鍵字
    // let where = 'WHERE p.postcategory_sid = ?';
    // const sql = ` SELECT p.*, c.type_name 
    // FROM post p 
    // JOIN postcategory c ON p.postcategory_sid = c.sid 
    // ${where}
    // LIMIT ?, ?`
    
    const perPage = 6;
let page = req.body.page ? parseInt(req.body.page) : 1;

let keyword = req.query.keyword || ''; // 從請求中獲取關鍵字
let where = 'WHERE postcategory_sid = ?';

if (keyword) {
  const kw_escaped = db.escape('%'+ keyword+'%');
  where += ` AND (
    \`title\` LIKE ${kw_escaped}
    OR
    \`content\` LIKE ${kw_escaped}
  )`;
}

const sql = `SELECT p.*, c.type_name FROM post p JOIN postcategory c ON p.postcategory_sid = c.sid ${where} ORDER BY p.publish_time DESC LIMIT ${
    perPage * (page - 1)
  }, ${perPage}`;
//ORDER BY p.publish_time DESC:時間排序（SQL做）

const offset = (page - 1) * perPage;
const [data] = await db.query(sql,[sid+1,offset,perPage]);

data.forEach(i => {
    i.publish_time = dayjs(i.publish_time).format('YYYY-MM-DD-HH:mm:ss');
});

const [totalRows] = await db.query(`SELECT COUNT(*) as totalRows FROM post ${where}`, [sid+1]);
const totalPages = Math.ceil(totalRows[0].totalRows / perPage);
console.log(totalRows);

    //todo
    
    const sql_good =`SELECT * FROM \`good\` WHERE \`member_id\`=?`
    const [good] = await db.query(sql_good,[member_id])

    const sql_collect =`SELECT * FROM \`postcollect\` WHERE \`member_id\`=?`
    const [collect] = await db.query(sql_collect,[member_id])

    const output  = [data, {totalPages: totalPages}, good, collect, keyword] 
    res.json(output)
});

//新增貼文
router.post('/:category/add',upload.single("preImg"), async (req, res) => {
  const postCategory = req.params.category;
  const {title, content,img} = req.body.requestData
  const member_id = res.locals.jwtData.id
  // const member_id = req.body.member_id
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
  const postcategory_sid = info.findIndex((v)=>v.id===postCategory)
  
  const sql = `INSERT INTO post (member_id, title, content, publish_time, postcategory_sid, good, img)
  VALUES (?, ?, ?, NOW(), ?, 0, ?);`

  const [data] = await db.query(sql, [member_id, title, content, postcategory_sid+1, img])

  res.json(data)
});

//新增圖片
//後端上傳照片測試
router.post("/:category/addphoto", upload.single("preImg"), async (req, res) => {
  const member_id = res.locals.jwtData.id;
  const sql = `UPDATE \`post\` SET \`img\` = ? WHERE \`member_id\` = ?;`;

  const image = req.file.filename;

  try {
    await db.query(sql, [image, member_id]);
    res.json(image);
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(500).json({ error: "An error occurred while updating data." });
  }
});

//讀取資料庫圖片檔名抓路徑（用不到）
router.get("/:category/getaddphoto", upload.single("preImg"), async (req, res) => {
  
    const output = {
        success: false,
        code: 0,
        error: "",
      };
    
      // const image = req.file.filename;
      const sql = `SELECT img FROM post WHERE sid=?`;
      const [rows] = await db.query(sql, [sid]);
      console.log(rows)
      res.json(rows[0]);

  });


//讀出新增文章頁會員頭貼
router.get("/:category/read_addpost_profilePhoto", upload.single("preImg"), async (req, res) => {});

//單筆貼文會員頭貼
router.get("/:category/:post/profilePhoto", upload.single("preImg"), async (req, res) => {});

// //文章排序和搜尋功能
// router.post("/:category/:post", async (req, res) => {});

//讀取文章留言
router.get("/:category/:post_sid/comments", async (req, res) => {
    const output = {
      success: false,
      error: "",
      comments: [],
    };
    
    const post_sid = parseInt(req.params.post_sid) || 0;
  
    if (!post_sid) {
      output.error = "沒有 sid !";
      return res.json(output);
    }
  
    try {
      // 在這裡根據 post_sid 查詢該帖子的評論資訊
      const sql = `SELECT * FROM comment WHERE post_sid = ?`;
      const [rows] = await db.query(sql, [post_sid]);
  
      rows.forEach((i) => {
        i.comment_time = dayjs(i.comment_time).format("YYYY-MM-DD-HH:mm:ss");
      });
  
      if (rows.length) {
        output.success = true;
        output.comments = rows;
      } else {
        output.error = "沒有評論!";
      }
  
      res.json(output);
    } catch (error) {
      console.error("An error occurred:", error);
      output.error = "發生錯誤!";
      res.json(output);
    }
  });
  

//新增文章留言
router.post("/:category/:post_sid/add-comment", async (req, res) => {
  const member_id = res.locals.jwtData.id
    const output = {
      success: false,
      error: "",
      row: null,
    };
  
    const post_sid = parseInt(req.params.post_sid) || 0;
    const comment = req.body.comment;
  
    if (!post_sid) {
      output.error = "沒有 sid !";
      return res.json(output);
    }
  
    try {
      const sql = `INSERT INTO comment (post_sid, comment, comment_time, member_id) VALUES (?, ?, NOW(), ?)`;
      const [result] = await db.query(sql, [post_sid, comment, member_id]);
    
      if (result.affectedRows === 1) {
        output.success = true;
        // 建立新增評論後的資訊物件
        const newCommentInfo = {
          post_sid: post_sid,
          comment: comment,
          comment_time: new Date().toISOString(), // 使用現在的時間
          member_id: member_id, 
        };
        output.row = newCommentInfo;
      } else {
        output.error = "評論新增失敗!";
      }
    
      res.json(output);
    } catch (error) {
      console.error("An error occurred:", error);
      output.error = "發生錯誤!";
      res.json(output);
    }
  });


//抓單筆貼文
router.get("/:category/:post_sid", async(req, res)=>{

    const output = {
        success: false,
        error:"",
        row:null
    };
    const post_sid = parseInt(req.params.post_sid) || 0;
    // console.log(post_sid)
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

//編輯貼文

//刪除貼文

//
// router.post('/:category', async (req, res) => {
//     const postCategory = req.params.category;
//     console.log(req.body.page);
//     const info = [
//         {
//         text: '八卦版',
//         id: 'gossip',
//     },
//         {
//         text: '愛情版',
//         id: 'love',
        
//     },
//         {
//         text: '鬼故事版',
//         id: 'ghost',
//     },
//         {
//         text: '籤詩版',
//         id: 'fortunesticks',
//     },
// ]   
//     const sid = info.findIndex((v)=>v.id===postCategory)
    
//     const sql = ` SELECT p.*, c.type_name 
//     FROM post p 
//     JOIN postcategory c ON p.postcategory_sid = c.sid 
//     WHERE p.postcategory_sid = ? 
//     LIMIT ?, ?`

//     const perPage = 6;
//     const page = req.body.page || 1;
//     const offset = (page - 1) * perPage;
//     const [data] = await db.query(sql,[sid+1,offset,perPage])

//     const [totalRows] = await db.query('SELECT COUNT(*) as totalRows FROM post WHERE postcategory_sid = ?', [sid+1]);
//     const totalPages = Math.ceil(totalRows[0].totalRows / perPage);
//     const output  = [data, {totalPages: totalPages}] 
//     res.json(output)
// });


//

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
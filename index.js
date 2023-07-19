if(process.argv[2] === "mac"){
  require('dotenv').config({
    path:__dirname + "/mac.env"
  });
}else{
  require('dotenv').config()
}
console.log(process.argv)

const express = require('express');

const app = express();

// 環境(node和next不同localhost)
const cors = require('cors');

const corsOptions = {
    credentials: true,
    origin: (origin, cb)=>{
      console.log({origin});
      cb(null, true);
    }
  }
  
app.use(cors(corsOptions));

// 前端傳資料用
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.set('view engine', 'ejs')

const router = express.Router();
const db = require(__dirname+'/modules/mysql2');
// 照片上傳
const upload = require(__dirname+'/modules/img-upload.js');


// 測試用(localhost:3002)
app.get('/', (req, res) => {
    res.send('<h1>This is template</h1>')
})

// 商品資料api
app.use('/shop', require(__dirname + '/routes/products-api') );

// 商品首頁輪播熱銷TOP10
app.post('/shop', async (req, res) => {
  // 從前端傳來的資料
  const requestData = req.body.requestData; 
  
  const [cid] = await db.query(
        `SELECT \`cid\` FROM \`categories\` WHERE \`category_name\` = '${requestData[0].id}';`
  )
  
  const [data] = await db.query(
        `SELECT * FROM \`products\` WHERE \`cid\` = ${cid[0].cid} ORDER BY \`purchase_num\` DESC LIMIT 10;`
  )
  
  res.json(data)
});

// 定義PORT
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`啟動${port}`)
})

app.use(express.static('public'))
app.use(express.static('node_modules/bootstrap/dist'))
app.use(express.static('node_modules/jquery/dist'))
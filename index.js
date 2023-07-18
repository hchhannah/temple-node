if(process.argv[2] === "mac"){
  require('dotenv').config({
    path:__dirname + "/mac.env"
  });
}else{
  require('dotenv').config()
}
console.log(process.argv)
const cors = require('cors');

const corsOptions = {
    credentials: true,
    origin: (origin, cb)=>{
      console.log({origin});
      cb(null, true);
    }
  }
  

const express = require('express');

const app = express();

app.use(cors(corsOptions));

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.send('<h1>This is template</h1>')
})
app.use('/shop', require(__dirname + '/routes/products-api') );
// app.use('/test', require(__dirname + '/routes/products-api') );

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`啟動${port}`)
})

app.use(express.static('public'))
app.use(express.static('node_modules/bootstrap/dist'))
app.use(express.static('node_modules/jquery/dist'))
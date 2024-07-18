const path = require('path'); // 路径模块
const express = require('express'); // 服务器

const app = express();
app.use(express.json())
app.use(express.static(path.resolve(__dirname, 'it-tools'),{}))
app.get('/api/_server_time',(req,res)=>{
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('server time:' + new Date().toISOString())
})
module.exports = app;

# nodejs-sless
参考vless实现sless的nodejs客户端和服务端, 不兼容vless

想着通过vless的服务端反写客户端, 但是那个头搞不定, 
干脆借鉴一下思想, 直接自己定义个头


# it-tools 
```
https://github.com/CorentinTh/it-tools.git
搜索workbox-56XXXX.js, 找到addFetchListener, 
在t=>{后添加if(new URL(t.request.url).pathname.startsWith('/api')){return fetch(r.request);}
跳过类似/api/xxx的请求, 否则在浏览器输入其他路径, 不会走服务端, 被前端的sevice-worker拦截

证书异常的域名下,service-work会失效, 无上面的问题且只能从首页访问
```

# 启动
## 服务端
本地开发或命令行启动 `node dev.js` 或 `npm run dev`
云服务启动, 需定义 UUID 和 PORT 共2个环境变量, 启动用 `node server.js`

## sless客户端
`node ./sless/client-sless.js` 或  `npm run client`

## vless客户端
https://github.com/2dust/v2rayN/releases

## serv00.com
修改dev.js中的UUID的值
mv dev.js app.js
devil www restart 域名

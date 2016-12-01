##HTTP WEB服务
常见HTTP请求类型：

 - **GET**
 - **POST** 包含请求内容
 - **PUT**
 - **DELETE** 删除URL指定的内容

#####http模块与httplib2模块
特性 | HTTP | httplib2
----- | :----- | :-----
是否标准库 | 是 | 否
缓存 | 不支持 | 支持
最后修改时间检查(If-Modified-Since) | 不支持 | 支持
ETag | 不支持 | 支持
数据压缩 | 不支持 | 支持
重定向 | urllib.request 自动重定向，将永久重定向视为临时重定向处理 | 返回处理了永久重定向的信息，并在本地保存记录，在发送请求之前自动重写为重定向后的URL，而不是发送新旧URL两次请求


#####HTTP请求头

 - Cache-Control HTTP缓存设置
  * max-age 缓存有效时间，单位为秒
  * public 使用服务器公共缓存
 - Expires 缓存过期时间，字符串形式的时间戳
 - Last-Modified 最后修改时间，格式为字符串形式的时间戳
 - ETag 类似Last-Modified，但存储哈希码
 - Accept-encoding 支持的压缩算法，在请求头中指定，常见的是gzip、deflate
  * Content-encoding 返回头中指定，服务器压缩数据所使用的算法
 - User-Agent 用户代理，包含浏览器信息等

#####httplib2使用
```
import httplib2
httplib2.debuglevel = 1
h = httplib2.Http('.cache')  # 指定本地缓存目录
response, content = h.request('https://www.bing.com')
response.status  # 请求返回码
content  # 请求返回内容
response.fromcache  # 是否使用缓存内容

h.request('https://www.bing.com', headers={'cache-control': 'no-cache'})  # 指定不使用缓存数据

response.previous  # 有重定向时初始URL的响应对象的信息

```

httplib2返回的content，是字节码(*bytes*)而不是字符串，需要注意。


######关于POST请求
```
from urllib.parse import urlencode
import httplib2
httplib2.debuglevel = 1
h = httplib2.Http('.cache')
data = {'status': 'Test update from Python 3'}
h.add_credentials('username', 'PASSWORD', 'identi.ca')  # 添加认证信息，在服务器返回401 Unauthorized时自动构造Auhtorization头并重新请求该URL
resp, content = h.request('https://www.bing.com', 'POST', urlencode(data), headers={'Content-Type':'application/x-www-form-urlencoded'})
```

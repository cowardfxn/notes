#Scrapy
> 版本 Scrapy 1.2.1

###创建工程
`scrapy startproject tutorial`

 - 单独的spider程序被放在生成的tutorial/spiders/目录下
  * 单独的spider程序通过继承scrapy.Spider类，重载name(属性)、start\_urls(属性)、start\_requests(方法)、parse(方法)等实现  
    **name** spider名，在单独项目下必须唯一  
    **start_requests** 必须返回元素是spider获取的Request的iterable，供后续方法使用  
    **start_urls** 定义被start\_requests使用的URL，只是替换URL时，可以只重写此属性，而不重写start\_requests方法  
    **parse** Request获取返回后调用，用于处理抓取的数据并通过数据生成新的Request(仍以iterable形式保存)。如果parse没有定义返回的Request，则过程结束

 - 启动某个spider `scrapy crawl spider_name`  
 - 启动scrapy shell `scrapy shell 'http://quotes.toscrape.com/page/1/'`  
要注意启动scrapy shell时使用引号包围URL，以防URL中的特殊字符在命令行中引起歧义

###数据解析
scrapy内部使用**lxml**包对获取的数据进行解析，但是由于lxml包功能丰富，在scrapy中仅使用了部分lxml的功能。  
BeautifulSoup解析速度较慢，因此不使用。  

######页面元素检索
scrapy发起的请求返回的Response对象，支持通过CSS、XPATH、正则等方式查找页面元素。  

 - CSS 支持使用标签名、标签的class等进行查找，部分语法类似jQuery  
 `response.css('title.css_title::text').re(r"(\w+) to (\w+)")`
 - xpath 支持使用xpath方式获取页面元素，可以检索条件包括标签层级、标签名、各种属性等，语法与CSS查找语法不同，功能更为丰富。  
 `response.xpath('//a[contains(@href, 'image')]/img/@src').extract()`

*css和xpath方法都支持在检索条件的最后通过各自的方式限定需要获取的数据内容*

######提取检索结果
在使用response的css、xpath、re等方法检索到需要的页面元素之后，scrapy对检索结果提供了extract和extract\_first等方法。

 - extract 将检索结果以数组形式返回
 - extract\_first 返回第一条检索结果，根据检索条件的定义，字符串或者其他格式

######输出爬取结果

 - `scrapy crawl quotes -o quotes.json` 直接输出到json文件中
 - `scrapy crawl quotes -o quotes.jl` 输出到jl格式文件中，一条json数据保存成一行，便于文件处理

######输入外部参数
命令行启动spider时可以通过-a参数指定外部变量，供spider内部使用  
`scrapy crawl quotes -o quotes-humor.json -a tag=humor`  
spider内部：  
```
...
tag = getattr(self, "tag", None)
...
```

Scrapy工程在执行的过程中，通过twisted框架实现了程序异步执行。在scrapy内部，多个URL请求可以实现并发。

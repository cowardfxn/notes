# Webpack

webpack的配置文件，默认名称是**webpack.config.js**

webpack的主要功能是合并各种前台资源，html、js、css等，生成合并的bundle文件。

#### 核心概念

 - entry 定义合并代码时的入口文件
 - output 定义合并代码后输出文件的位置、名称等信息
 - Loaders 定义筛选合并对象的规则和处理相应对象所使用的模块，定义在`config.module.rules`属性中
 - Plugins 引用外部插件，定义在`plugins`属性中，每个插件都需要用new语句实例化

#### 示例代码

```webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin'); // installed via npm
const webpack = require('webpack'); // to access built-in plugins
const path = require('path');

const config = {
    entry: './path/to/my/entry/file.js',  // 定义入口函数位置
    output: {  // 定义bundle文件路径和名称
        path: path.resolve(__dirname, 'dist'),
        filename: 'my-first-webpack.bundle.js'
    },
    module: {
        rules: [  // 定义了一个处理规则
            { test: /\.txt$/, use: 'raw-loader' }
        ]
    },
    plugins: [  // 引用插件
        new webpack.optimize.UglifyJsPlugin(),
        new HtmlWebpackPlugin({template: './src/index.html'})
    ]
};

module.exports = config;
```

#### 初始化webpack项目

##### 依赖库
```
npm init -y  // 新建npm
npm i --save-dev webpack  // 安装webpack
npm i lodash --save  // 安装lodash
npm i webpack-cli -D  // 安装webpack-cli
npm i --save style-loader css-loader  // 安装css加载库
npm i --save-dev file-loader  // 文件加载库
npm i --save-dev csv-loader xml-loader  // 数据文件加载库
npm i --save-dev html-webpack-plugin  // html打包
npm i --save-dev clean-webpack-plugin  // 移除前次build遗留文件
npm i --save-dev uglifyjs-webpack-plugin  // 移除未使用代码
npm i --save-dev webpack-merge  // 合并config项目
```

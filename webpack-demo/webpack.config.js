const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin'); // tree shaking

module.exports = {
    entry: {
        app: './src/index.js',
        print: './src/print.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.join(__dirname, "./dist")
    },
    module: {
        rules: [{
            test: /\.css$/,
            use: [
                'style-loader',
                'css-loader'
            ]
        }, {
            test: /\.(png|svg|jpg|gif)$/,
            use: [
                'file-loader'
            ]
        }, {
            test: /\.(woff|woff2|eot|ttf|otf)&/,
            use: [
                'file-loader'
            ]
        }, {
            test: /\.(csv|tst)$/,
            use: [
                'csv-loader'
            ]
        }, {
            test: /\.xml$/,
            use: [
                'xml-loader'
            ]
        }]
    },
    mode: 'development',
    devtool: 'inline-source-map',
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Output Management'
        }),
        new CleanWebpackPlugin(['dist']),
        new UglifyJSPlugin()
    ]
};
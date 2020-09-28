var path = require('path');
var webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV,
  entry: {
    'index': './index.js',
  },
  output: {
    path: path.resolve(__dirname, './dist/'),
    publicPath: '/',
    filename: 'endereco-js-agent.js'
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      sourceMap: false,
      terserOptions: {
        output: {
          comments: false,
        },
      },
      extractComments: false,
    })],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'css-loader',
        ],
      },
      {
        test: /\.scss$/,
        use: [
          'css-loader',
          'sass-loader'
        ],
      },
      {
        test: /\.sass$/,
        use: [
          'sass-loader?indentedSyntax'
        ],
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        use: {loader: 'html-loader'}
      },
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true,
    overlay: true
  },
  performance: {
    hints: false
  },
  devtool: '(none)',
  plugins: [
  ]
};

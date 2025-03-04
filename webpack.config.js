var path = require('path');
var TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV,
  entry: {
    'endereco': './bundle.js',
  },
  output: {
    filename: 'endereco.min.js',
    path: path.resolve(__dirname, './dist/'),
    publicPath: '/',
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        output: {
          comments: false,
        }
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
        test: /\.svg$/,
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
    contentBase: path.join(__dirname, '/'),
    compress: true,
    port: 9000,
  },
  performance: {
    hints: false
  },
  devtool: false,
  plugins: [
  ],
};

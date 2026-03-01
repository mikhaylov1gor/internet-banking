const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './main.tsx',
  output: {
    path: path.resolve(__dirname, '../../../../dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
    publicPath: '/',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    modules: [
      path.resolve(__dirname, '../../../node_modules'),
      path.resolve(__dirname, '../../shared'),
      'node_modules',
    ],
    conditionNames: ['import', 'require', 'default'],
    mainFields: ['exports', 'main', 'module'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: './tsconfig.json',
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.json',
            transpileOnly: true,
          },
        },
        exclude: (modulePath) => {
          if (/node_modules/.test(modulePath)) {
            return !/@shared/.test(modulePath);
          }
          return false;
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      inject: 'body',
    }),
  ],
  watchOptions: {
    ignored: /node_modules\/(?!@shared)/,
    followSymlinks: true,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 5173,
    host: '0.0.0.0',
    hot: true,
    open: true,
    historyApiFallback: true,
    watchFiles: {
      paths: [
        path.resolve(__dirname, '../../shared/**/*'),
        path.resolve(__dirname, '../../../node_modules/@shared/**/*'),
      ],
      options: {
        usePolling: false,
      },
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        pathRewrite: { '^/api': '' },
        logLevel: 'debug',
      },
    },
  },
  devtool: 'source-map',
};


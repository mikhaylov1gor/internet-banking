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
    port: 5175,
    host: '0.0.0.0',
    hot: true,
    open: true,
    historyApiFallback: true,
    setupMiddlewares: (middlewares, devServer) => {
      const http = require('http');

      devServer.app.post('/api/sso/login', (req, res) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => {
          const body = Buffer.concat(chunks);
          const backendReq = http.request(
            {
              hostname: 'localhost',
              port: 8080,
              path: '/sso/login',
              method: 'POST',
              headers: {
                'content-type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
                'content-length': body.length,
              },
            },
            (backendRes) => {
              if (backendRes.statusCode === 302) {
                const location = backendRes.headers['location'] || '';
                backendRes.resume();
                res.setHeader('Content-Type', 'application/json');
                res.status(200).end(JSON.stringify({ redirect: location }));
              } else {
                res.status(backendRes.statusCode);
                Object.entries(backendRes.headers).forEach(([k, v]) => {
                  if (v !== undefined) res.setHeader(k, v);
                });
                backendRes.pipe(res);
              }
            },
          );
          backendReq.on('error', () => {
            res.status(502).json({ error: 'Ошибка соединения с сервером' });
          });
          backendReq.write(body);
          backendReq.end();
        });
      });

      return middlewares;
    },
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

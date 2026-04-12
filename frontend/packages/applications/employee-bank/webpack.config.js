const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const FIREBASE_SW_APP = {
  apiKey: 'AIzaSyANrtOp6WcAzpP9F2BOI7yDG8VH9EpRsGk',
  authDomain: 'internet-bank-61d9b.firebaseapp.com',
  projectId: 'internet-bank-61d9b',
  storageBucket: 'internet-bank-61d9b.firebasestorage.app',
  messagingSenderId: '453381667763',
  appId: '1:453381667763:web:6a588739b538e7260c69c6',
};

const writeFirebaseMessagingSw = () => {
  const sw = `importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: ${JSON.stringify(FIREBASE_SW_APP.apiKey)},
  authDomain: ${JSON.stringify(FIREBASE_SW_APP.authDomain)},
  projectId: ${JSON.stringify(FIREBASE_SW_APP.projectId)},
  storageBucket: ${JSON.stringify(FIREBASE_SW_APP.storageBucket)},
  messagingSenderId: ${JSON.stringify(FIREBASE_SW_APP.messagingSenderId)},
  appId: ${JSON.stringify(FIREBASE_SW_APP.appId)}
});
firebase.messaging();
`;
  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'public', 'firebase-messaging-sw.js'), sw);
};

writeFirebaseMessagingSw();

class CopyFirebaseMessagingSwPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('CopyFirebaseMessagingSwPlugin', () => {
      const outDir = compiler.options.output.path;
      const src = path.join(__dirname, 'public', 'firebase-messaging-sw.js');
      const dest = path.join(outDir, 'firebase-messaging-sw.js');
      if (fs.existsSync(src)) {
        fs.mkdirSync(outDir, { recursive: true });
        fs.copyFileSync(src, dest);
      }
    });
  }
}

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
    new CopyFirebaseMessagingSwPlugin(),
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
    client: {
      webSocketURL: {
        pathname: '/webpack-hmr',
      },
    },
    webSocketServer: {
      options: {
        path: '/webpack-hmr',
      },
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
      '/monitoring': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        pathRewrite: { '^/api': '' },
        logLevel: 'debug',
      },
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
        secure: false,
        onProxyReqWs: (proxyReq, req) => {
          const reqUrl = new URL(req.url, 'http://localhost');
          const token = reqUrl.searchParams.get('token');
          if (token) {
            proxyReq.setHeader('Authorization', `Bearer ${token}`);
          }
        },
      },
    },
  },
  devtool: 'source-map',
};


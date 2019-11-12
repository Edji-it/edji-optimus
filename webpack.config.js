const path = require('path')
const nodeExternals = require('webpack-node-externals')
const SentryWebpackPlugin = require('@sentry/webpack-plugin')

const ENTRY = path.resolve(__dirname, 'src/index.js')
const OUT_DIR = path.resolve(__dirname, 'build')

const plugins = []
const release = require('./scripts/get-release-id')()
if (release) {
  console.log(`releasing sourcemaps for ${release} to sentry`)
  plugins.push(
    new SentryWebpackPlugin({
      release,
      include: './build',
      ignoreFile: '.gitignore',
      ignore: ['node_modules', 'webpack.config.js'],
    }),
  )
}

module.exports = {
  entry: ENTRY,
  mode: 'production',
  target: 'node', // default includes some stuff we need like fs
  externals: [nodeExternals()], // ignore all modules in node_modules
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: OUT_DIR,
  },
  plugins,
}

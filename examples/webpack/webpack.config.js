const transformer = require('@huston007/ts-transformer-shape/transformer').default;

module.exports = {
  mode: 'development',
  devtool: false,
  entry: './index.ts',
  output: {
    filename: `built-reference.js`,
    path: __dirname
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          getCustomTransformers: program => ({
            before: [transformer(program)]
          })
        }
      }
    ]
  }
};

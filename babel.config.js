module.exports = {
  presets: [
    '@quasar/babel-preset-app'
  ],
  plugins: [
    [
      '@babel/transform-runtime', {
        regenerator: true
      }
    ],
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    '@babel/plugin-proposal-function-sent',
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-proposal-numeric-separator',
    '@babel/plugin-proposal-throw-expressions'
  ]
}

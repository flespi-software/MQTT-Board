import vue from 'rollup-plugin-vue'
import babel from 'rollup-plugin-babel'
import { eslint } from 'rollup-plugin-eslint'
import bundleSize from 'rollup-plugin-filesize'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import ignore from 'rollup-plugin-ignore'
import autoExternal from 'rollup-plugin-auto-external'
import { uglify } from 'rollup-plugin-uglify'
import json from 'rollup-plugin-json'

const extensions = ['.js', '.vue']
const isProduction = !process.env.ROLLUP_WATCH
const globals = { vue: 'Vue', dev: 'DEV' }

const lintOpts = {
  extensions,
  cache: true,
  throwOnError: true
}

const prodPlugins = [
  ignore(['quasar', 'vue']),
  autoExternal({
    dependencies: true,
    peerDependencies: true
  }),
  resolve({
    jail: '/src'
  }),
  json(),
  commonjs(),
  vue({
    template: {
      isProduction,
      compilerOptions: { preserveWhitespace: false }
    },
    css: true
  }),
  babel({
    exclude: 'node_modules/**',
    externalHelpers: false,
    runtimeHelpers: true,
    extensions: ['.js', '.vue']
  }),
  uglify()
]
const devPlugins = [
  eslint(lintOpts),
  bundleSize()
]

let plugins = isProduction ? prodPlugins : [...devPlugins, ...prodPlugins]
let vueConfig = {
  plugins,
  input: 'src/components/MqttClient.vue',
  output: {
    globals,
    name: 'mqtt-board',
    sourcemap: true,
    file: 'lib/mqtt-board.js',
    format: 'umd',
    exports: 'named'
  }
}
export default [
  vueConfig
]

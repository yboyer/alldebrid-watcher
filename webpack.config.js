/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const webpack = require('webpack')
const dotenv = require('dotenv').config()
const CopyPlugin = require('copy-webpack-plugin')

const dist = path.resolve(__dirname, 'dist')

module.exports = {
    mode: process.env.WEBPACK_MODE || 'development',
    entry: {
        preload: './src/preload.tsx',
        main: './src/index.ts',
    },
    output: {
        path: dist,
        filename: '[name].js',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json'],
        modules: ['node_modules'],
    },
    target: 'electron-renderer',
    module: {
        rules: [
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
            },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.ALLDEBRID_API_KEY': JSON.stringify(
                dotenv.parsed.ALLDEBRID_API_KEY
            ),
            'process.env.TMDB_API_KEY': JSON.stringify(dotenv.parsed.TMDB_API_KEY),
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: 'src/package.json',
                    to: `${dist}/package.json`,
                },
                {
                    from: 'src/index.html',
                    to: `${dist}/index.html`,
                },
            ],
        }),
    ],
}

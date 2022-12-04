/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
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
            {
                test: /\.svg$/,
                use: ['@svgr/webpack'],
            },
        ],
    },
    plugins: [
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

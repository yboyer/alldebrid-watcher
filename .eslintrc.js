const _ = require('lodash')
const importPath = require('eslint-config-airbnb-base').extends.find((rule) =>
    rule.endsWith('imports.js')
)
const importRules = require(importPath).rules
const disabledImportRules = _.mapValues(importRules, (rule) => 'off')

module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'plugin:prettier/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
    ],
    plugins: ['import', '@typescript-eslint', 'prettier'],
    parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'module',
        allowImportExportEverywhere: true,
        ecmaFeatures: {
            legacyDecorators: true,
        },
    },
    rules: {
        'prefer-const': 'warn',
        'max-lines': 'warn',
        'prefer-template': 'error',
        'no-undef': 'error',
        'no-unused-vars': 'error',
        ...disabledImportRules,
        'prettier/prettier': [
            'error',
            {
                singleQuote: true,
                semi: false,
                bracketSpacing: true,
                tabWidth: 4,
                printWidth: 90,
            },
        ],
    },
    env: {
        jest: true,
        node: true,
    },
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                allowImportExportEverywhere: true,
                ecmaFeatures: {
                    legacyDecorators: true,
                },
            },
            plugins: ['@typescript-eslint', 'import'],
            rules: {
                'prefer-const': 'warn',
                'max-lines': 'warn',

                // See https://github.com/benmosher/eslint-plugin-import/issues/1282
                'import/named': 'off',

                // These ESLint rules are known to cause issues with typescript-eslint
                // See https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/src/configs/recommended.json
                camelcase: 'off',
                'prefer-template': 'error',

                // '@typescript-eslint/camelcase': ['error', { properties: 'never' }],
                'no-array-constructor': 'off',
                '@typescript-eslint/no-array-constructor': 'error',
                'no-empty-function': 'off',
                '@typescript-eslint/no-empty-function': 'error',
                'no-unused-vars': 'off',
                '@typescript-eslint/no-unused-vars': [
                    'error',
                    { ignoreRestSiblings: true },
                ],
                'no-use-before-define': 'off',
                '@typescript-eslint/no-use-before-define': 'error',

                // The type of the parameters and return value are not required
                'valid-jsdoc': [
                    'error',
                    {
                        requireReturnType: false,
                        requireParamType: false,
                        requireReturn: false,
                    },
                ],
                '@typescript-eslint/consistent-type-assertions': 'error',
                '@typescript-eslint/no-namespace': 'error',
                '@typescript-eslint/explicit-module-boundary-types': 'off',
                '@typescript-eslint/explicit-function-return-type': 'off',
                'prettier/prettier': [
                    'error',
                    {
                        singleQuote: true,
                        semi: false,
                        bracketSpacing: true,
                        tabWidth: 4,
                        printWidth: 90,
                    },
                ],
            },
        },
    ],
}

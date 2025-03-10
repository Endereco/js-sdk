import globals from 'globals'
import path from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import pluginJs from '@eslint/js'

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({ baseDirectory: __dirname, recommendedConfig: pluginJs.configs.recommended })

export default [
  { languageOptions: { globals: globals.browser } },
  ...compat.extends('standard'),
  {
    rules: {
      // Ilja's preference (discussable)
      'indent': ['error', 4],
      'semi': ['error', 'always'],

      // Code quality rules
      'max-depth': ['error', 4],                    // Prevent deeply nested code
      'max-params': ['error', 4],                   // Limit function parameters
      'no-magic-numbers': ['warn', {                // Discourage unexplained numbers
        'ignore': [-1, 0, 1, 2],
        'ignoreArrayIndexes': true
      }],

      // Modern JS practices
      'prefer-const': 'error',                      // Use const when variables aren't reassigned
      'no-var': 'error',                            // Avoid var in favor of let/const
      'prefer-template': 'error',                   // Use template literals instead of string concatenation
      'object-shorthand': 'error',                  // Use shorthand syntax for object methods and properties

      // Error prevention
      'no-implicit-coercion': 'error',              // Avoid implicit type conversions
      'no-return-await': 'error',                   // Avoid unnecessary return await
      'require-await': 'error',                     // Ensure async functions use await
      'no-promise-executor-return': 'error',        // Prevent returning values from Promise executors

      // Improved readability
      'max-len': ['warn', {                         // Keep line length reasonable
        'code': 160,
        'ignoreComments': true,
        'ignoreUrls': true,
        'ignoreStrings': true,
        'ignoreTemplateLiterals': true
      }],
      'padding-line-between-statements': [          // Improve code organization
        'error',
        { 'blankLine': 'always', 'prev': '*', 'next': 'return' },
        { 'blankLine': 'always', 'prev': ['const', 'let', 'var'], 'next': '*' },
        { 'blankLine': 'any', 'prev': ['const', 'let', 'var'], 'next': ['const', 'let', 'var'] }
      ]
    }
  }
]
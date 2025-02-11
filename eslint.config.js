import stylistic from '@stylistic/eslint-plugin'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslint from '@eslint/js'

export default tseslint.config(
  { ignores: ['*.d.ts, **/dist'] },
  eslint.configs.recommended,
  tseslint.configs.eslintRecommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  {
    files: ['**/*.vue'],
    extends: [pluginVue.configs['flat/recommended']],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
    rules: {
      'vue/html-self-closing': ['error', { html: { void: 'always', normal: 'never' } }],
      'vue/script-indent': ['error', 2, { baseIndent: 1 }],
    },
  },
  {
    files: ['eslint.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    extends: [stylistic.configs['recommended-flat']],
    rules: {
      '@stylistic/indent': 'off',
    },
  },
)

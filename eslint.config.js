import eslint from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  stylistic.configs.customize(),
  { files: ['**/*.{js,mjs,cjs,ts,vue}'] },
  { languageOptions: { globals: globals.browser } },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs['flat/essential'],
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: tseslint.parser } } },
)

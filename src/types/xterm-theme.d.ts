import { ITheme } from '@xterm/xterm'

declare module 'xterm-theme' {
    const themes: Record<string, ITheme>
    export default themes
}

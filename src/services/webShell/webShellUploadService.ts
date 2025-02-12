import { h } from 'vue'
import { useModal } from 'naive-ui'

import { UploadService } from '../webSocketBase/uploadService'
import type { UploadSession, DuplicatePolicy } from '../webSocketBase/uploadService'
import type { WebShellWSManager } from './webshellWSManager'
import ConfirmActions from './ConfirmActions.vue'

// 利用 TypeScript 的声明合并，扩展 WebshellWSManager 的事件类型
declare module './webShellWSManager' {
  interface WebShellWSManagerEventMap {
    'upload-need-confirm': CustomEvent<UploadSession>
  }
}

export class WebShellUploadService extends UploadService {
  constructor(manager: WebShellWSManager, sessions: UploadSession[]) {
    super(manager, sessions)

    manager.addEventListener('upload-need-confirm', ({ detail: session }) => {
      doConfirm(session).then(
        policy => session.resolveConfirm(policy),
        () => session.rejectConfirm(new Error()),
      )
    })
  }
}

function doConfirm(session: UploadSession) {
  return new Promise<DuplicatePolicy>((resolve, reject) => {
    const modal = useModal()
    const { destroy } = modal.create({
      title: '目标路径已存在',
      content: `${session.path} 已存在，是否继续操作？`,
      preset: 'dialog',
      closable: true,
      footer: () =>
        h(ConfirmActions, {
          onKeepBoth() {
            resolve('rename')
            destroy()
          },
          onSkip() {
            resolve('skip')
            destroy()
          },
          onOverwrite() {
            resolve('overwrite')
            destroy()
          },
        }),
      onClose() {
        reject(new Error())
      },
    })
  })
}

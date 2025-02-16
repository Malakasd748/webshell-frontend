import { h } from 'vue'
import { useModal } from 'naive-ui'

import { UploadService } from '../webSocketBase/uploadService'
import type { UploadSession, DuplicatePolicy } from '../webSocketBase/uploadService'
import type { WebShellWSManager } from './webShellWSManager'
import ConfirmActions from './ConfirmActions.vue'

// 利用 TypeScript 的声明合并，扩展事件类型
declare module '../webSocketBase/webSocketManager' {
  interface WebSocketManagerEventMap {
    'upload-need-confirm': CustomEvent<UploadSession>
  }
}

export class WebShellUploadService extends UploadService {
  constructor(sessions: UploadSession[]) {
    super(sessions)
  }

  override register(manager: WebShellWSManager) {
    super.register(manager)

    manager.e.addEventListener('upload-need-confirm', ({ detail: session }) => {
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

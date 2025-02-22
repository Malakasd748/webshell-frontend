import { h, shallowReactive } from 'vue'

import { UploadService, UploadSession } from '../websocketBase/uploadService'
import type { DuplicatePolicy } from '../websocketBase/uploadService'
import type { WebShellWSManager } from './webshellWSManager'
import ConfirmActions from './ConfirmActions.vue'
import naiveApi from '@/providers/naiveApi'

// 利用 TypeScript 的声明合并，扩展事件类型
declare module '../websocketBase/websocketManager' {
  interface WebSocketManagerEventMap {
    'upload-need-confirm': CustomEvent<UploadSession>
  }
}

export class WebShellUploadService extends UploadService {
  constructor(sessions: UploadSession[]) {
    super(sessions, (...args) => shallowReactive(new UploadSession(...args)))
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
    const { destroy } = naiveApi.dialog.warning({
      title: '目标路径已存在',
      content: `${session.path} 已存在，是否继续操作？`,
      closable: true,
      action: () =>
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

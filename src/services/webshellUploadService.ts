import { h } from 'vue';
import { Modal } from 'ant-design-vue';

import { UploadService } from './base/uploadService';
import type { UploadSession, DuplicatePolicy } from './base/uploadService';
import type { WebshellWSManager } from './webshellWSManager';
import ConfirmActions from './ConfirmActions.vue';

// 利用 TypeScript 的声明合并，扩展 WebshellWSManager 的事件类型
declare module './webshellWSManager' {
  interface WebshellWSManagerEventMap {
    'upload-need-confirm': CustomEvent<UploadSession>;
  }
}

export class WebshellUploadService extends UploadService {
  constructor(manager: WebshellWSManager, sessions: UploadSession[]) {
    super(manager, sessions);

    manager.addEventListener('upload-need-confirm', ({ detail: session }) => {
      doConfirm(session).then(
        (policy) => session.resolveConfirm(policy),
        () => session.rejectConfirm(),
      );
    });
  }
}

function doConfirm(session: UploadSession) {
  return new Promise<DuplicatePolicy>((resolve, reject) => {
    const { destroy } = Modal.warning({
      title: '目标路径已存在',
      content: `${session.path} 已存在，是否继续操作？`,
      closable: true,
      footer: () =>
        h(ConfirmActions, {
          onKeepBoth() {
            resolve('rename');
            destroy();
          },
          onSkip() {
            resolve('skip');
            destroy();
          },
          onOverwrite() {
            resolve('overwrite');
            destroy();
          },
        }),
      onCancel() {
        reject();
      },
    });
  });
}

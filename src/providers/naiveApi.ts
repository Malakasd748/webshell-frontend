import type { MessageApi, DialogApi } from 'naive-ui'

let dialog: DialogApi | undefined = undefined
let message: MessageApi | undefined = undefined

export default {
  get dialog() {
    return dialog!
  },
  set dialog(value: DialogApi) {
    dialog = value
  },
  get message() {
    return message!
  },
  set message(value: MessageApi) {
    message = value
  },
}

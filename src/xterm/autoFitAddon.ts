import { useResizeObserver } from '@vueuse/core'
import { FitAddon } from '@xterm/addon-fit'
import { debounce } from 'lodash-es'

import type { Term } from '.'

// pollyfill
if (!Element.prototype.checkVisibility) {
  Element.prototype.checkVisibility = function () {
    // 检查元素是否在 DOM 中
    if (!document.contains(this)) {
      return false
    }

    const computeVisibility = (element: Element): boolean => {
      if (!element) return true

      const style = window.getComputedStyle(element)

      // 检查关键的可见性属性
      if (style.display === 'none') return false
      if (style.visibility === 'hidden' || style.visibility === 'collapse') return false
      if (parseFloat(style.opacity) === 0) return false

      // 检查元素大小
      const rect = element.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) return false

      return element.parentElement ? computeVisibility(element.parentElement) : true
    }

    return computeVisibility(this)
  }
}

/**
 * 自适应终端大小
 */
export class AutoFitAddon extends FitAddon {
  private term?: Term

  override activate(term: Term) {
    super.activate(term)
    this.term = term
    useResizeObserver(() => term.container, () => this.fit())
  }

  override fit = debounce(() => {
    const container = this.term?.container
    if (!container?.checkVisibility()) {
      return
    }

    super.fit()

    this.term?.focus()
  }, 200)
}

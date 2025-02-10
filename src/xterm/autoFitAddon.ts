import { FitAddon } from '@xterm/addon-fit';
import { debounce } from 'lodash-es';
import { useResizeObserver } from '@vueuse/core';

import type { Term } from '.';

// pollyfill
if (!Element.prototype.checkVisibility) {
  Element.prototype.checkVisibility = function () {
    // 检查是否在 DOM 中
    if (!document.contains(this)) {
      return false;
    }

    // 仅检查 display: none
    const hasDisplay = (element: Element): boolean => {
      if (!element) return true;
      const style = window.getComputedStyle(element);
      if (style.display === 'none') return false;
      return element.parentElement ? hasDisplay(element.parentElement) : true;
    };

    return hasDisplay(this);
  };
}

/**
 * 自适应终端大小
 */
export class AutoFitAddon extends FitAddon {
  private _terminal?: Term;

  override activate(term: Term) {
    super.activate(term);

    useResizeObserver(() => term.container, () => this.fit());
  }

  override fit = debounce(() => {
    const container = this._terminal?.container;
    if (!container?.checkVisibility()) {
      return;
    }

    super.fit();

    this._terminal?.focus();
  }, 200);
}

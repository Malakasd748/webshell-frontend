import { beforeAll, afterAll, vi, expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any>
    extends jest.Matchers<void, T>,
      TestingLibraryMatchers<T, void> {}
}

expect.extend(matchers)

// Mock Element.prototype.checkVisibility
beforeAll(() => {
  if (!Element.prototype.checkVisibility) {
    Element.prototype.checkVisibility = function () {
      return true
    }
  }
})

// Clean up any global mocks after all tests
afterAll(() => {
  vi.resetModules()
})

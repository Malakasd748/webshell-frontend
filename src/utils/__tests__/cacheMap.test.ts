import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { CacheMap } from '../cacheMap'

describe('CacheMap', () => {
  let cacheMap: CacheMap<string, number>

  beforeEach(() => {
    vi.useFakeTimers()
    cacheMap = new CacheMap(1000) // 使用1秒的TTL便于测试
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should store and retrieve values correctly', () => {
    cacheMap.set('key1', 100)
    expect(cacheMap.get('key1')).toBe(100)
  })

  it('should expire items after TTL', () => {
    cacheMap.set('key1', 100)
    vi.advanceTimersByTime(500)
    expect(cacheMap.get('key1')).toBe(100) // 500ms后应该还存在
    vi.advanceTimersByTime(501)
    expect(cacheMap.get('key1')).toBeUndefined() // 超过1000ms后应该被删除
  })

  it('should reset TTL when setting existing key', () => {
    cacheMap.set('key1', 100)
    vi.advanceTimersByTime(800) // 前进800ms
    cacheMap.set('key1', 200) // 重设相同的key，应该重置定时器
    vi.advanceTimersByTime(800) // 再前进800ms，总共1600ms，但因为中途重置了，所以值应该还在
    expect(cacheMap.get('key1')).toBe(200)
  })

  it('should delete items correctly', () => {
    cacheMap.set('key1', 100)
    expect(cacheMap.delete('key1')).toBe(true)
    expect(cacheMap.get('key1')).toBeUndefined()
    expect(cacheMap.delete('key1')).toBe(false) // 再次删除应返回false
  })

  it('should clear all items correctly', () => {
    cacheMap.set('key1', 100)
    cacheMap.set('key2', 200)
    cacheMap.clear()
    expect(cacheMap.size).toBe(0)
    expect(cacheMap.get('key1')).toBeUndefined()
    expect(cacheMap.get('key2')).toBeUndefined()
  })

  it('should handle multiple items with different TTLs', () => {
    cacheMap.set('key1', 100)
    vi.advanceTimersByTime(500)
    cacheMap.set('key2', 200)
    vi.advanceTimersByTime(500)
    expect(cacheMap.get('key1')).toBeUndefined() // key1应该过期
    expect(cacheMap.get('key2')).toBe(200) // key2应该还在
    vi.advanceTimersByTime(500)
    expect(cacheMap.get('key2')).toBeUndefined() // 现在key2也应该过期了
  })
})

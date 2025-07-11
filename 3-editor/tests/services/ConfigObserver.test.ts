import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CompositeConfigObserver,
  ConfigObserver,
  ConfigObserverFactory,
  FontSizeConfigObserver,
  LineNumberConfigObserver,
  PredefinedConfigObservers,
  ThemeConfigObserver
} from '../../src/services/ConfigObserver'
import { EditorConfigChangeData } from '../../src/types/ObserverTypes'

describe('ConfigObserver', () => {
  let mockCallback: ReturnType<typeof vi.fn>
  let configObserver: ConfigObserver
  let mockChangeData: EditorConfigChangeData

  beforeEach(() => {
    mockCallback = vi.fn()
    configObserver = new ConfigObserver(mockCallback)
    mockChangeData = {
      key: 'theme',
      oldValue: 'light',
      newValue: 'dark',
      timestamp: Date.now(),
      source: 'test'
    }
  })

  describe('Basic Observer Functionality', () => {
    it('should call callback when receiving updates', () => {
      configObserver.update(mockChangeData)

      expect(mockCallback).toHaveBeenCalledWith(mockChangeData)
    })

    it('should not call callback when inactive', () => {
      configObserver.deactivate()
      configObserver.update(mockChangeData)

      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should reactivate after deactivation', () => {
      configObserver.deactivate()
      configObserver.activate()
      configObserver.update(mockChangeData)

      expect(mockCallback).toHaveBeenCalledWith(mockChangeData)
    })

    it('should have unique ID', () => {
      const observer1 = new ConfigObserver(() => {})
      const observer2 = new ConfigObserver(() => {})

      expect(observer1.getId()).not.toBe(observer2.getId())
    })

    it('should accept custom ID', () => {
      const customObserver = new ConfigObserver(() => {}, { id: 'custom-id' })

      expect(customObserver.getId()).toBe('custom-id')
    })

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error')
      })
      const errorObserver = new ConfigObserver(errorCallback)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        errorObserver.update(mockChangeData)
      }).not.toThrow()

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Key Filtering', () => {
    it('should filter by watched keys', () => {
      const filteredObserver = new ConfigObserver(mockCallback, {
        watchedKeys: ['fontSize']
      })

      // テーマ変更（監視対象外）
      filteredObserver.update(mockChangeData)
      expect(mockCallback).not.toHaveBeenCalled()

      // フォントサイズ変更（監視対象）
      const fontSizeChangeData = {
        ...mockChangeData,
        key: 'fontSize' as const,
        oldValue: 14,
        newValue: 16
      }
      filteredObserver.update(fontSizeChangeData)
      expect(mockCallback).toHaveBeenCalledWith(fontSizeChangeData)
    })

    it('should add and remove watched keys', () => {
      const filteredObserver = new ConfigObserver(mockCallback, {
        watchedKeys: ['theme']
      })

      // 最初は theme のみ監視
      expect(filteredObserver.isWatchingKey('theme')).toBe(true)
      expect(filteredObserver.isWatchingKey('fontSize')).toBe(false)

      // fontSize を追加
      filteredObserver.addWatchedKey('fontSize')
      expect(filteredObserver.isWatchingKey('fontSize')).toBe(true)

      // theme を削除
      filteredObserver.removeWatchedKey('theme')
      expect(filteredObserver.isWatchingKey('theme')).toBe(false)
    })

    it('should return watched keys list', () => {
      const filteredObserver = new ConfigObserver(mockCallback, {
        watchedKeys: ['theme', 'fontSize']
      })

      const watchedKeys = filteredObserver.getWatchedKeys()
      expect(watchedKeys).toEqual(expect.arrayContaining(['theme', 'fontSize']))
    })

    it('should watch all keys when no filter set', () => {
      const allKeysObserver = new ConfigObserver(mockCallback)

      expect(allKeysObserver.isWatchingKey('theme')).toBe(true)
      expect(allKeysObserver.isWatchingKey('fontSize')).toBe(true)
      expect(allKeysObserver.isWatchingKey('anyKey')).toBe(true)
    })

    it('should switch to watching all keys', () => {
      const filteredObserver = new ConfigObserver(mockCallback, {
        watchedKeys: ['theme']
      })

      expect(filteredObserver.isWatchingKey('fontSize')).toBe(false)

      filteredObserver.watchAllKeys()
      expect(filteredObserver.isWatchingKey('fontSize')).toBe(true)
    })
  })
})

describe('ThemeConfigObserver', () => {
  it('should only respond to theme changes', () => {
    const themeCallback = vi.fn()
    const themeObserver = new ThemeConfigObserver(themeCallback)

    // テーマ変更
    themeObserver.update({
      key: 'theme',
      oldValue: 'light',
      newValue: 'dark',
      timestamp: Date.now(),
      source: 'test'
    })

    expect(themeCallback).toHaveBeenCalledWith('dark')

    // 他の設定変更
    themeObserver.update({
      key: 'fontSize',
      oldValue: 14,
      newValue: 16,
      timestamp: Date.now(),
      source: 'test'
    })

    expect(themeCallback).toHaveBeenCalledTimes(1) // 一度だけ呼ばれる
  })
})

describe('FontSizeConfigObserver', () => {
  it('should only respond to fontSize changes', () => {
    const fontSizeCallback = vi.fn()
    const fontSizeObserver = new FontSizeConfigObserver(fontSizeCallback)

    fontSizeObserver.update({
      key: 'fontSize',
      oldValue: 14,
      newValue: 16,
      timestamp: Date.now(),
      source: 'test'
    })

    expect(fontSizeCallback).toHaveBeenCalledWith(16)
  })
})

describe('LineNumberConfigObserver', () => {
  it('should only respond to showLineNumbers changes', () => {
    const lineNumberCallback = vi.fn()
    const lineNumberObserver = new LineNumberConfigObserver(lineNumberCallback)

    lineNumberObserver.update({
      key: 'showLineNumbers',
      oldValue: false,
      newValue: true,
      timestamp: Date.now(),
      source: 'test'
    })

    expect(lineNumberCallback).toHaveBeenCalledWith(true)
  })
})

describe('CompositeConfigObserver', () => {
  let compositeObserver: CompositeConfigObserver
  let mockCallback1: ReturnType<typeof vi.fn>
  let mockCallback2: ReturnType<typeof vi.fn>

  beforeEach(() => {
    compositeObserver = new CompositeConfigObserver()
    mockCallback1 = vi.fn()
    mockCallback2 = vi.fn()
  })

  it('should manage multiple child observers', () => {
    const observer1 = new ConfigObserver(mockCallback1, { watchedKeys: ['theme'] })
    const observer2 = new ConfigObserver(mockCallback2, { watchedKeys: ['fontSize'] })

    compositeObserver.addObserver('theme', observer1)
    compositeObserver.addObserver('fontSize', observer2)

    expect(compositeObserver.getObserverCount()).toBe(2)
    expect(compositeObserver.getObserverKeys()).toEqual(['theme', 'fontSize'])
  })

  it('should delegate updates to appropriate child observers', () => {
    const observer1 = new ConfigObserver(mockCallback1, { watchedKeys: ['theme'] })
    const observer2 = new ConfigObserver(mockCallback2, { watchedKeys: ['fontSize'] })

    compositeObserver.addObserver('theme', observer1)
    compositeObserver.addObserver('fontSize', observer2)

    // テーマ変更
    compositeObserver.update({
      key: 'theme',
      oldValue: 'light',
      newValue: 'dark',
      timestamp: Date.now(),
      source: 'test'
    })

    expect(mockCallback1).toHaveBeenCalled()
    expect(mockCallback2).not.toHaveBeenCalled()
  })

  it('should remove child observers', () => {
    const observer1 = new ConfigObserver(mockCallback1)
    compositeObserver.addObserver('theme', observer1)

    expect(compositeObserver.getObserverCount()).toBe(1)

    compositeObserver.removeObserver('theme')
    expect(compositeObserver.getObserverCount()).toBe(0)
  })

  it('should deactivate all child observers', () => {
    const observer1 = new ConfigObserver(mockCallback1)
    const observer2 = new ConfigObserver(mockCallback2)

    compositeObserver.addObserver('obs1', observer1)
    compositeObserver.addObserver('obs2', observer2)

    compositeObserver.deactivate()

    expect(observer1.isActive()).toBe(false)
    expect(observer2.isActive()).toBe(false)
  })

  it('should activate all child observers', () => {
    const observer1 = new ConfigObserver(mockCallback1)
    const observer2 = new ConfigObserver(mockCallback2)

    compositeObserver.addObserver('obs1', observer1)
    compositeObserver.addObserver('obs2', observer2)

    compositeObserver.deactivate()
    compositeObserver.activate()

    expect(observer1.isActive()).toBe(true)
    expect(observer2.isActive()).toBe(true)
  })
})

describe('ConfigObserverFactory', () => {
  it('should create basic observer', () => {
    const callback = vi.fn()
    const observer = ConfigObserverFactory.createBasicObserver(callback, { id: 'test-id' })

    expect(observer.getId()).toBe('test-id')
    expect(observer.isActive()).toBe(true)
  })

  it('should create theme observer', () => {
    const callback = vi.fn()
    const observer = ConfigObserverFactory.createThemeObserver(callback, 'theme-test')

    expect(observer.getId()).toBe('theme-test')
    expect(observer.isWatchingKey('theme')).toBe(true)
    expect(observer.isWatchingKey('fontSize')).toBe(false)
  })

  it('should create font size observer', () => {
    const callback = vi.fn()
    const observer = ConfigObserverFactory.createFontSizeObserver(callback)

    expect(observer.isWatchingKey('fontSize')).toBe(true)
  })

  it('should create line number observer', () => {
    const callback = vi.fn()
    const observer = ConfigObserverFactory.createLineNumberObserver(callback)

    expect(observer.isWatchingKey('showLineNumbers')).toBe(true)
  })

  it('should create composite observer', () => {
    const observer = ConfigObserverFactory.createCompositeObserver('composite-test')

    expect(observer.getId()).toBe('composite-test')
    expect(observer.getObserverCount()).toBe(0)
  })

  it('should create UI update observer', () => {
    const updateFunction = vi.fn()
    const observer = ConfigObserverFactory.createUIUpdateObserver(updateFunction)

    observer.update({
      key: 'theme',
      oldValue: 'light',
      newValue: 'dark',
      timestamp: Date.now(),
      source: 'test'
    })

    expect(updateFunction).toHaveBeenCalledWith('theme', 'dark', 'light')
  })
})

describe('PredefinedConfigObservers', () => {
  it('should create dark mode toggle observer', () => {
    const toggleFunction = vi.fn()
    const observer = PredefinedConfigObservers.createDarkModeToggle(toggleFunction)

    observer.update({
      key: 'theme',
      oldValue: 'light',
      newValue: 'dark',
      timestamp: Date.now(),
      source: 'test'
    })

    expect(toggleFunction).toHaveBeenCalledWith(true)
  })

  it('should create accessibility font size observer', () => {
    const updateFunction = vi.fn()
    const observer = PredefinedConfigObservers.createAccessibilityFontSize(updateFunction)

    observer.update({
      key: 'fontSize',
      oldValue: 14,
      newValue: 18,
      timestamp: Date.now(),
      source: 'test'
    })

    expect(updateFunction).toHaveBeenCalledWith(18)
  })

  it('should create layout observer', () => {
    const layoutFunction = vi.fn()
    const observer = PredefinedConfigObservers.createLayoutObserver(layoutFunction)

    observer.update({
      key: 'showLineNumbers',
      oldValue: false,
      newValue: true,
      timestamp: Date.now(),
      source: 'test'
    })

    expect(layoutFunction).toHaveBeenCalledWith(true)
  })
})

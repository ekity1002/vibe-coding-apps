import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CallbackObserver, getGlobalObserverService, ObserverService, resetGlobalObserverService } from '../../src/services/ObserverService'
import { IObserver } from '../../src/types/ObserverTypes'

describe('ObserverService', () => {
  let observerService: ObserverService<string>

  beforeEach(() => {
    observerService = new ObserverService<string>()
  })

  afterEach(() => {
    resetGlobalObserverService()
  })

  describe('Observer Registration', () => {
    it('should attach observers correctly', () => {
      const observer = new CallbackObserver(() => {}, 'test-observer')

      observerService.attach(observer)

      expect(observerService.getObserverCount()).toBe(1)
      expect(observerService.hasObserver('test-observer')).toBe(true)
    })

    it('should not attach duplicate observers', () => {
      const observer = new CallbackObserver(() => {}, 'test-observer')

      observerService.attach(observer)
      observerService.attach(observer) // 重複登録

      expect(observerService.getObserverCount()).toBe(1)
    })

    it('should detach observers correctly', () => {
      const observer = new CallbackObserver(() => {}, 'test-observer')

      observerService.attach(observer)
      observerService.detach(observer)

      expect(observerService.getObserverCount()).toBe(0)
      expect(observerService.hasObserver('test-observer')).toBe(false)
    })

    it('should detach observers by ID', () => {
      const observer = new CallbackObserver(() => {}, 'test-observer')

      observerService.attach(observer)
      const removed = observerService.detachById('test-observer')

      expect(removed).toBe(true)
      expect(observerService.getObserverCount()).toBe(0)
    })

    it('should return false when detaching non-existent observer by ID', () => {
      const removed = observerService.detachById('non-existent')

      expect(removed).toBe(false)
    })

    it('should enforce maximum observer limit', () => {
      const smallService = new ObserverService({ maxObservers: 2 })

      smallService.attach(new CallbackObserver(() => {}, 'observer-1'))
      smallService.attach(new CallbackObserver(() => {}, 'observer-2'))

      expect(() => {
        smallService.attach(new CallbackObserver(() => {}, 'observer-3'))
      }).toThrow('Maximum number of observers (2) exceeded')
    })
  })

  describe('Notification System', () => {
    it('should notify all active observers', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const observer1 = new CallbackObserver(callback1, 'observer-1')
      const observer2 = new CallbackObserver(callback2, 'observer-2')

      observerService.attach(observer1)
      observerService.attach(observer2)

      observerService.notify('test data')

      expect(callback1).toHaveBeenCalledWith('test data')
      expect(callback2).toHaveBeenCalledWith('test data')
    })

    it('should not notify inactive observers', () => {
      const callback = vi.fn()
      const observer = new CallbackObserver(callback, 'observer-1')

      observerService.attach(observer)
      observer.deactivate()

      observerService.notify('test data')

      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle errors during notification', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Observer error')
      })
      const normalCallback = vi.fn()

      const errorObserver = new CallbackObserver(errorCallback, 'error-observer')
      const normalObserver = new CallbackObserver(normalCallback, 'normal-observer')

      observerService.attach(errorObserver)
      observerService.attach(normalObserver)

      // エラーログを抑制
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      observerService.notify('test data')

      expect(errorCallback).toHaveBeenCalled()
      expect(normalCallback).toHaveBeenCalled() // エラーがあっても他のオブザーバーは実行される
      expect(observerService.getStats().notificationErrors).toBe(1)

      consoleError.mockRestore()
    })

    it('should handle empty observer list', () => {
      expect(() => {
        observerService.notify('test data')
      }).not.toThrow()
    })
  })

  describe('Statistics Tracking', () => {
    it('should track notification statistics', () => {
      const observer = new CallbackObserver(() => {}, 'test-observer')
      observerService.attach(observer)

      observerService.notify('test data 1')
      observerService.notify('test data 2')

      const stats = observerService.getStats()
      expect(stats.totalNotifications).toBe(2)
      expect(stats.totalObservers).toBe(1)
      expect(stats.activeObservers).toBe(1)
      expect(stats.lastNotificationTime).toBeGreaterThan(0)
    })

    it('should track error statistics', () => {
      const errorObserver = new CallbackObserver(() => {
        throw new Error('Test error')
      }, 'error-observer')

      observerService.attach(errorObserver)

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      observerService.notify('test data')

      expect(observerService.getStats().notificationErrors).toBe(1)

      consoleError.mockRestore()
    })

    it('should reset statistics', () => {
      const observer = new CallbackObserver(() => {}, 'test-observer')
      observerService.attach(observer)

      observerService.notify('test data')
      observerService.resetStats()

      const stats = observerService.getStats()
      expect(stats.totalNotifications).toBe(0)
      expect(stats.notificationErrors).toBe(0)
      expect(stats.averageNotificationTime).toBe(0)
    })
  })

  describe('Observer Management', () => {
    it('should get observer by ID', () => {
      const observer = new CallbackObserver(() => {}, 'test-observer')
      observerService.attach(observer)

      const retrieved = observerService.getObserver('test-observer')
      expect(retrieved).toBe(observer)
    })

    it('should return undefined for non-existent observer', () => {
      const retrieved = observerService.getObserver('non-existent')
      expect(retrieved).toBeUndefined()
    })

    it('should get all observer IDs', () => {
      observerService.attach(new CallbackObserver(() => {}, 'observer-1'))
      observerService.attach(new CallbackObserver(() => {}, 'observer-2'))

      const ids = observerService.getAllObserverIds()
      expect(ids).toEqual(expect.arrayContaining(['observer-1', 'observer-2']))
      expect(ids).toHaveLength(2)
    })

    it('should clear all observers', () => {
      observerService.attach(new CallbackObserver(() => {}, 'observer-1'))
      observerService.attach(new CallbackObserver(() => {}, 'observer-2'))

      observerService.clear()

      expect(observerService.getObserverCount()).toBe(0)
      expect(observerService.getActiveObserverCount()).toBe(0)
    })
  })

  describe('Configuration', () => {
    it('should update configuration', () => {
      observerService.updateConfig({
        enableDebug: true,
        maxObservers: 50
      })

      // 設定が更新されたことを間接的に確認（デバッグログ等）
      expect(() => {
        observerService.debug()
      }).not.toThrow()
    })

    it('should use default configuration', () => {
      const defaultService = new ObserverService()
      expect(defaultService.getObserverCount()).toBe(0)
    })
  })

  describe('Event Notification', () => {
    it('should notify with event structure', () => {
      const callback = vi.fn()
      const observer = new CallbackObserver(callback, 'test-observer')

      observerService.attach(observer)
      observerService.notifyEvent('CONFIG_CHANGE', 'test data', 'test-source')

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CONFIG_CHANGE',
          data: 'test data',
          source: 'test-source',
          timestamp: expect.any(Number)
        })
      )
    })
  })
})

describe('CallbackObserver', () => {
  it('should create observer with callback', () => {
    const callback = vi.fn()
    const observer = new CallbackObserver(callback, 'test-id')

    expect(observer.getId()).toBe('test-id')
    expect(observer.isActive()).toBe(true)
  })

  it('should generate ID if not provided', () => {
    const callback = vi.fn()
    const observer = new CallbackObserver(callback)

    expect(observer.getId()).toMatch(/^callback-observer-/)
  })

  it('should handle activation/deactivation', () => {
    const callback = vi.fn()
    const observer = new CallbackObserver(callback)

    observer.update('test data')
    expect(callback).toHaveBeenCalledWith('test data')

    callback.mockClear()
    observer.deactivate()
    observer.update('test data 2')
    expect(callback).not.toHaveBeenCalled()

    observer.activate()
    observer.update('test data 3')
    expect(callback).toHaveBeenCalledWith('test data 3')
  })
})

describe('Global Observer Service', () => {
  it('should provide singleton global service', () => {
    const service1 = getGlobalObserverService()
    const service2 = getGlobalObserverService()

    expect(service1).toBe(service2)
  })

  it('should reset global service', () => {
    const service1 = getGlobalObserverService()
    service1.attach(new CallbackObserver(() => {}, 'test-observer'))

    resetGlobalObserverService()

    const service2 = getGlobalObserverService()
    expect(service2.getObserverCount()).toBe(0)
  })
})

describe('Custom Observer Implementation', () => {
  let customObserverService: ObserverService<string>

  beforeEach(() => {
    customObserverService = new ObserverService<string>()
  })

  class MockObserver implements IObserver<string> {
    private id: string
    private active: boolean = true
    public updateCalled: boolean = false
    public lastData: string | null = null

    constructor(id: string) {
      this.id = id
    }

    update(data: string): void {
      this.updateCalled = true
      this.lastData = data
    }

    getId(): string {
      return this.id
    }

    isActive(): boolean {
      return this.active
    }

    setActive(active: boolean): void {
      this.active = active
    }
  }

  it('should work with custom observer implementation', () => {
    const observer = new MockObserver('mock-observer')
    customObserverService.attach(observer)

    customObserverService.notify('test data')

    expect(observer.updateCalled).toBe(true)
    expect(observer.lastData).toBe('test data')
  })

  it('should respect isActive method', () => {
    const observer = new MockObserver('mock-observer')
    customObserverService.attach(observer)

    observer.setActive(false)
    customObserverService.notify('test data')

    expect(observer.updateCalled).toBe(false)
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EditorConfig } from '../../src/config/EditorConfig'
import { ConfigObserver } from '../../src/services/ConfigObserver'

describe('EditorConfig Singleton', () => {
  beforeEach(() => {
    // Singletonインスタンスをリセット（テスト用）
    EditorConfig.resetInstance()
  })

  describe('Singleton Pattern', () => {
    it('should create only one instance', () => {
      const instance1 = EditorConfig.getInstance()
      const instance2 = EditorConfig.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should return the same instance on multiple calls', () => {
      const instances = Array.from({ length: 5 }, () => EditorConfig.getInstance())
      const firstInstance = instances[0]
      
      instances.forEach(instance => {
        expect(instance).toBe(firstInstance)
      })
    })

    it('should have a private constructor (TypeScript compile-time check)', () => {
      // TypeScriptの型システムでprivateコンストラクタが保護されていることを確認
      // 実行時ではなく、コンパイル時の型チェックに依存
      // この「テスト」は主に、TypeScriptがprivateコンストラクタを適切に型チェックすることを文書化
      
      // 実際のテストは、インスタンスが正しく作成されることを確認
      const instance = EditorConfig.getInstance()
      expect(instance).toBeInstanceOf(EditorConfig)
    })
  })

  describe('Default Settings', () => {
    it('should have default font size of 14', () => {
      const config = EditorConfig.getInstance()
      expect(config.getFontSize()).toBe(14)
    })

    it('should have default theme of light', () => {
      const config = EditorConfig.getInstance()
      expect(config.getTheme()).toBe('light')
    })

    it('should have line numbers enabled by default', () => {
      const config = EditorConfig.getInstance()
      expect(config.getShowLineNumbers()).toBe(true)
    })

    it('should have auto save disabled by default', () => {
      const config = EditorConfig.getInstance()
      expect(config.getAutoSave()).toBe(false)
    })

    it('should return complete default settings object', () => {
      const config = EditorConfig.getInstance()
      const settings = config.getSettings()
      
      expect(settings).toEqual({
        fontSize: 14,
        theme: 'light',
        showLineNumbers: true,
        autoSave: false,
        tabSize: 2,
        wordWrap: true
      })
    })

    it('should have default tab size of 2', () => {
      const config = EditorConfig.getInstance()
      expect(config.getTabSize()).toBe(2)
    })

    it('should have word wrap enabled by default', () => {
      const config = EditorConfig.getInstance()
      expect(config.getWordWrap()).toBe(true)
    })
  })

  describe('Font Size Management', () => {
    it('should set and get font size correctly', () => {
      const config = EditorConfig.getInstance()
      
      config.setFontSize(16)
      expect(config.getFontSize()).toBe(16)
      
      config.setFontSize(18)
      expect(config.getFontSize()).toBe(18)
    })

    it('should handle all valid font sizes', () => {
      const config = EditorConfig.getInstance()
      const validSizes = [12, 14, 16, 18] as const
      
      validSizes.forEach(size => {
        config.setFontSize(size)
        expect(config.getFontSize()).toBe(size)
      })
    })
  })

  describe('Theme Management', () => {
    it('should set and get theme correctly', () => {
      const config = EditorConfig.getInstance()
      
      config.setTheme('dark')
      expect(config.getTheme()).toBe('dark')
      
      config.setTheme('light')
      expect(config.getTheme()).toBe('light')
    })

    it('should handle theme switching', () => {
      const config = EditorConfig.getInstance()
      
      // Initial state
      expect(config.getTheme()).toBe('light')
      
      // Switch to dark
      config.setTheme('dark')
      expect(config.getTheme()).toBe('dark')
      
      // Switch back to light
      config.setTheme('light')
      expect(config.getTheme()).toBe('light')
    })
  })

  describe('Line Numbers Management', () => {
    it('should set and get line numbers setting correctly', () => {
      const config = EditorConfig.getInstance()
      
      config.setShowLineNumbers(false)
      expect(config.getShowLineNumbers()).toBe(false)
      
      config.setShowLineNumbers(true)
      expect(config.getShowLineNumbers()).toBe(true)
    })

    it('should toggle line numbers correctly', () => {
      const config = EditorConfig.getInstance()
      const initialValue = config.getShowLineNumbers()
      
      config.setShowLineNumbers(!initialValue)
      expect(config.getShowLineNumbers()).toBe(!initialValue)
      
      config.setShowLineNumbers(initialValue)
      expect(config.getShowLineNumbers()).toBe(initialValue)
    })
  })

  describe('Auto Save Management', () => {
    it('should set and get auto save setting correctly', () => {
      const config = EditorConfig.getInstance()
      
      config.setAutoSave(true)
      expect(config.getAutoSave()).toBe(true)
      
      config.setAutoSave(false)
      expect(config.getAutoSave()).toBe(false)
    })

    it('should maintain auto save state correctly', () => {
      const config = EditorConfig.getInstance()
      
      // Enable auto save
      config.setAutoSave(true)
      expect(config.getAutoSave()).toBe(true)
      
      // Change other settings
      config.setFontSize(16)
      config.setTheme('dark')
      
      // Auto save should still be enabled
      expect(config.getAutoSave()).toBe(true)
    })
  })

  describe('Settings Persistence Across Instance Calls', () => {
    it('should maintain settings across multiple getInstance calls', () => {
      const config1 = EditorConfig.getInstance()
      
      // Change settings
      config1.setFontSize(18)
      config1.setTheme('dark')
      config1.setShowLineNumbers(false)
      config1.setAutoSave(true)
      
      // Get new reference to singleton
      const config2 = EditorConfig.getInstance()
      
      // Settings should be preserved
      expect(config2.getFontSize()).toBe(18)
      expect(config2.getTheme()).toBe('dark')
      expect(config2.getShowLineNumbers()).toBe(false)
      expect(config2.getAutoSave()).toBe(true)
    })

    it('should return the same settings object structure', () => {
      const config = EditorConfig.getInstance()
      
      // Modify settings
      config.setFontSize(16)
      config.setTheme('dark')
      config.setShowLineNumbers(false)
      config.setAutoSave(true)
      
      const settings1 = config.getSettings()
      const settings2 = EditorConfig.getInstance().getSettings()
      
      expect(settings1).toEqual(settings2)
      expect(settings1).toEqual({
        fontSize: 16,
        theme: 'dark',
        showLineNumbers: false,
        autoSave: true,
        tabSize: 2,
        wordWrap: true
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid successive calls', () => {
      const instances = []
      for (let i = 0; i < 100; i++) {
        instances.push(EditorConfig.getInstance())
      }
      
      // All instances should be the same
      const firstInstance = instances[0]
      instances.forEach(instance => {
        expect(instance).toBe(firstInstance)
      })
    })

    it('should maintain state after reset and recreation', () => {
      const config1 = EditorConfig.getInstance()
      config1.setFontSize(18)
      
      EditorConfig.resetInstance()
      
      const config2 = EditorConfig.getInstance()
      // After reset, should have default values
      expect(config2.getFontSize()).toBe(14)
    })
  })

  describe('Observer Pattern Integration', () => {
    let config: EditorConfig
    let mockCallback: ReturnType<typeof vi.fn>
    let observer: ConfigObserver

    beforeEach(() => {
      config = EditorConfig.getInstance()
      mockCallback = vi.fn()
      observer = new ConfigObserver(mockCallback, { id: 'test-observer' })
    })

    describe('Observer Registration', () => {
      it('should attach and detach observers', () => {
        expect(config.getObserverCount()).toBe(0)
        
        config.attach(observer)
        expect(config.getObserverCount()).toBe(1)
        expect(config.hasObserver('test-observer')).toBe(true)
        
        config.detach(observer)
        expect(config.getObserverCount()).toBe(0)
        expect(config.hasObserver('test-observer')).toBe(false)
      })

      it('should detach observers by ID', () => {
        config.attach(observer)
        expect(config.getObserverCount()).toBe(1)
        
        config.detachById('test-observer')
        expect(config.getObserverCount()).toBe(0)
      })

      it('should provide observer IDs', () => {
        const observer1 = new ConfigObserver(() => {}, { id: 'observer-1' })
        const observer2 = new ConfigObserver(() => {}, { id: 'observer-2' })
        
        config.attach(observer1)
        config.attach(observer2)
        
        const ids = config.getObserverIds()
        expect(ids).toContain('observer-1')
        expect(ids).toContain('observer-2')
        expect(ids.length).toBe(2)
      })
    })

    describe('Change Notifications', () => {
      beforeEach(() => {
        config.attach(observer)
      })

      it('should notify on font size change', () => {
        config.setFontSize(16)
        
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'fontSize',
            oldValue: 14,
            newValue: 16,
            source: 'EditorConfig',
            timestamp: expect.any(Number)
          })
        )
      })

      it('should notify on theme change', () => {
        config.setTheme('dark')
        
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'theme',
            oldValue: 'light',
            newValue: 'dark'
          })
        )
      })

      it('should notify on line numbers setting change', () => {
        config.setShowLineNumbers(false)
        
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'showLineNumbers',
            oldValue: true,
            newValue: false
          })
        )
      })

      it('should notify on auto save change', () => {
        config.setAutoSave(true)
        
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'autoSave',
            oldValue: false,
            newValue: true
          })
        )
      })

      it('should notify on tab size change', () => {
        config.setTabSize(4)
        
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'tabSize',
            oldValue: 2,
            newValue: 4
          })
        )
      })

      it('should notify on word wrap change', () => {
        config.setWordWrap(false)
        
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'wordWrap',
            oldValue: true,
            newValue: false
          })
        )
      })

      it('should not notify if value does not change', () => {
        config.setFontSize(14) // 同じ値に設定
        expect(mockCallback).not.toHaveBeenCalled()
      })

      it('should notify multiple observers', () => {
        const callback2 = vi.fn()
        const observer2 = new ConfigObserver(callback2, { id: 'observer-2' })
        config.attach(observer2)
        
        config.setTheme('dark')
        
        expect(mockCallback).toHaveBeenCalled()
        expect(callback2).toHaveBeenCalled()
      })
    })

    describe('Bulk Settings Update', () => {
      beforeEach(() => {
        config.attach(observer)
      })

      it('should notify for multiple changes', () => {
        const newSettings = {
          fontSize: 16 as const,
          theme: 'dark' as const,
          showLineNumbers: false
        }
        
        config.updateSettings(newSettings)
        
        expect(mockCallback).toHaveBeenCalledTimes(3)
        expect(config.getFontSize()).toBe(16)
        expect(config.getTheme()).toBe('dark')
        expect(config.getShowLineNumbers()).toBe(false)
      })

      it('should only notify for changed settings', () => {
        const newSettings = {
          fontSize: 14, // 同じ値
          theme: 'dark' as const // 変更
        }
        
        config.updateSettings(newSettings)
        
        expect(mockCallback).toHaveBeenCalledTimes(1) // themeのみ
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'theme',
            newValue: 'dark'
          })
        )
      })
    })

    describe('Settings Validation', () => {
      it('should validate correct settings', () => {
        const validSettings = {
          fontSize: 16 as const,
          theme: 'dark' as const,
          tabSize: 4
        }
        
        expect(config.validateSettings(validSettings)).toBe(true)
      })

      it('should reject invalid font size', () => {
        const invalidSettings = {
          fontSize: 20 as any
        }
        
        expect(config.validateSettings(invalidSettings)).toBe(false)
      })

      it('should reject invalid theme', () => {
        const invalidSettings = {
          theme: 'blue' as any
        }
        
        expect(config.validateSettings(invalidSettings)).toBe(false)
      })

      it('should reject invalid tab size', () => {
        const invalidSettings = {
          tabSize: 10
        }
        
        expect(config.validateSettings(invalidSettings)).toBe(false)
      })
    })

    describe('Settings Reset', () => {
      beforeEach(() => {
        config.attach(observer)
      })

      it('should reset to defaults and notify changes', () => {
        // 設定を変更
        config.setFontSize(18)
        config.setTheme('dark')
        config.setShowLineNumbers(false)
        
        mockCallback.mockClear()
        
        // デフォルトにリセット
        config.resetToDefaults()
        
        const settings = config.getSettings()
        expect(settings).toEqual({
          fontSize: 14,
          theme: 'light',
          showLineNumbers: true,
          autoSave: false,
          tabSize: 2,
          wordWrap: true
        })
        
        // 変更があった項目の通知確認
        expect(mockCallback).toHaveBeenCalledTimes(3)
      })
    })

    describe('Error Handling', () => {
      it('should handle observer errors gracefully', () => {
        const errorCallback = vi.fn(() => {
          throw new Error('Observer error')
        })
        const normalCallback = vi.fn()
        
        const errorObserver = new ConfigObserver(errorCallback, { id: 'error-observer' })
        const normalObserver = new ConfigObserver(normalCallback, { id: 'normal-observer' })
        
        config.attach(errorObserver)
        config.attach(normalObserver)
        
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        
        config.setTheme('dark')
        
        expect(errorCallback).toHaveBeenCalled()
        expect(normalCallback).toHaveBeenCalled()
        expect(consoleSpy).toHaveBeenCalled()
        
        consoleSpy.mockRestore()
      })
    })
  })
})
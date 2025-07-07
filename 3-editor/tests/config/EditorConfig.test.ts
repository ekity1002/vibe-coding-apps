import { describe, it, expect, beforeEach } from 'vitest'
import { EditorConfig } from '../../src/config/EditorConfig'

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
      })
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
})
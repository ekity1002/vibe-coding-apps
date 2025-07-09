import { describe, it, expect } from 'vitest'
import { TextService } from '../../src/services/TextService'

describe('TextService', () => {
  describe('Character Count', () => {
    it('should count characters correctly', () => {
      expect(TextService.getCharacterCount('Hello World')).toBe(11)
      expect(TextService.getCharacterCount('Hello')).toBe(5)
      expect(TextService.getCharacterCount('')).toBe(0)
    })

    it('should count special characters', () => {
      expect(TextService.getCharacterCount('Hello\nWorld')).toBe(11)
      expect(TextService.getCharacterCount('Hello\tWorld')).toBe(11)
      expect(TextService.getCharacterCount('Hello 世界')).toBe(8)
    })

    it('should handle unicode characters', () => {
      expect(TextService.getCharacterCount('🚀🌟💻')).toBe(3)
      expect(TextService.getCharacterCount('café')).toBe(4)
      expect(TextService.getCharacterCount('नमस्ते')).toBe(6)
    })

    it('should handle whitespace', () => {
      expect(TextService.getCharacterCount('   ')).toBe(3)
      expect(TextService.getCharacterCount(' Hello World ')).toBe(13)
    })
  })

  describe('Line Count', () => {
    it('should count lines correctly', () => {
      expect(TextService.getLineCount('Hello\nWorld')).toBe(2)
      expect(TextService.getLineCount('Single line')).toBe(1)
      expect(TextService.getLineCount('')).toBe(1)
    })

    it('should handle multiple line breaks', () => {
      expect(TextService.getLineCount('Line 1\nLine 2\nLine 3')).toBe(3)
      expect(TextService.getLineCount('Line 1\n\nLine 3')).toBe(3)
      expect(TextService.getLineCount('\n\n\n')).toBe(4)
    })

    it('should handle different line endings', () => {
      expect(TextService.getLineCount('Line 1\r\nLine 2')).toBe(2)
      expect(TextService.getLineCount('Line 1\rLine 2')).toBe(2)
    })

    it('should handle trailing newlines', () => {
      expect(TextService.getLineCount('Hello\n')).toBe(2)
      expect(TextService.getLineCount('Hello\nWorld\n')).toBe(3)
    })
  })

  describe('Word Count', () => {
    it('should count words correctly', () => {
      expect(TextService.getWordCount('Hello World')).toBe(2)
      expect(TextService.getWordCount('Hello')).toBe(1)
      expect(TextService.getWordCount('')).toBe(0)
    })

    it('should handle multiple spaces', () => {
      expect(TextService.getWordCount('  Hello   World  ')).toBe(2)
      expect(TextService.getWordCount('Hello     World')).toBe(2)
    })

    it('should handle special separators', () => {
      expect(TextService.getWordCount('Hello\nWorld')).toBe(2)
      expect(TextService.getWordCount('Hello\tWorld')).toBe(2)
      expect(TextService.getWordCount('Hello,World')).toBe(1) // No space, considered one word
    })

    it('should handle only whitespace', () => {
      expect(TextService.getWordCount('   ')).toBe(0)
      expect(TextService.getWordCount('\n\n\n')).toBe(0)
      expect(TextService.getWordCount('\t\t\t')).toBe(0)
    })

    it('should handle punctuation correctly', () => {
      expect(TextService.getWordCount('Hello, World!')).toBe(2)
      expect(TextService.getWordCount('One-word')).toBe(1)
      expect(TextService.getWordCount("It's working")).toBe(2)
    })
  })

  describe('Text Validation', () => {
    it('should validate text correctly', () => {
      expect(TextService.isValidText('Valid text')).toBe(true)
      expect(TextService.isValidText('')).toBe(true)
      expect(TextService.isValidText('   ')).toBe(true)
    })

    it('should reject non-string values', () => {
      expect(TextService.isValidText(null as unknown)).toBe(false)
      expect(TextService.isValidText(undefined as unknown)).toBe(false)
      expect(TextService.isValidText(123 as unknown)).toBe(false)
      expect(TextService.isValidText({} as unknown)).toBe(false)
      expect(TextService.isValidText([] as unknown)).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(TextService.isValidText(0 as unknown)).toBe(false)
      expect(TextService.isValidText(false as unknown)).toBe(false)
      expect(TextService.isValidText(true as unknown)).toBe(false)
    })
  })

  describe('Text Sanitization', () => {
    it('should sanitize text correctly', () => {
      const input = 'Hello\u0000World\u0001Test'
      const expected = 'HelloWorldTest'
      expect(TextService.sanitizeText(input)).toBe(expected)
    })

    it('should remove control characters', () => {
      const input = 'Normal\u0008text\u007Fhere'
      const expected = 'Normaltexthere'
      expect(TextService.sanitizeText(input)).toBe(expected)
    })

    it('should preserve valid characters', () => {
      const input = 'Hello\nWorld\tTest'
      expect(TextService.sanitizeText(input)).toBe(input)
    })

    it('should handle non-string input', () => {
      expect(TextService.sanitizeText(null as unknown)).toBe('')
      expect(TextService.sanitizeText(undefined as unknown)).toBe('')
      expect(TextService.sanitizeText(123 as unknown)).toBe('')
    })

    it('should preserve unicode characters', () => {
      const input = 'Hello 世界 🚀'
      expect(TextService.sanitizeText(input)).toBe(input)
    })
  })

  describe('Text Truncation', () => {
    it('should truncate text correctly', () => {
      expect(TextService.truncateText('Hello World', 5)).toBe('Hello...')
      expect(TextService.truncateText('Short', 10)).toBe('Short')
      expect(TextService.truncateText('', 5)).toBe('')
    })

    it('should handle exact length', () => {
      expect(TextService.truncateText('Hello', 5)).toBe('Hello')
      expect(TextService.truncateText('Hello World', 11)).toBe('Hello World')
    })

    it('should handle zero and negative lengths', () => {
      expect(TextService.truncateText('Hello', 0)).toBe('...')
      expect(TextService.truncateText('Hello', -1)).toBe('...')
    })

    it('should handle non-string input', () => {
      expect(TextService.truncateText(null as unknown, 5)).toBe('')
      expect(TextService.truncateText(undefined as unknown, 5)).toBe('')
      expect(TextService.truncateText(123 as unknown, 5)).toBe('')
    })

    it('should handle unicode characters in truncation', () => {
      expect(TextService.truncateText('🚀🌟💻🎯🔥', 3)).toBe('🚀🌟💻...')
      expect(TextService.truncateText('Hello 世界', 8)).toBe('Hello 世界')
    })
  })

  describe('Text Statistics', () => {
    it('should calculate comprehensive text statistics', () => {
      const text = 'Hello World!\nThis is a test.'
      const stats = TextService.getTextStatistics(text)
      
      expect(stats.characters).toBe(28)
      expect(stats.lines).toBe(2)
      expect(stats.words).toBe(6)
      expect(stats.charactersNoSpaces).toBe(23)
    })

    it('should handle empty text', () => {
      const stats = TextService.getTextStatistics('')
      
      expect(stats.characters).toBe(0)
      expect(stats.lines).toBe(1)
      expect(stats.words).toBe(0)
      expect(stats.charactersNoSpaces).toBe(0)
    })

    it('should handle only whitespace', () => {
      const stats = TextService.getTextStatistics('   \n   ')
      
      expect(stats.characters).toBe(7)
      expect(stats.lines).toBe(2)
      expect(stats.words).toBe(0)
      expect(stats.charactersNoSpaces).toBe(0) // no spaces after removing all whitespace
    })
  })

  describe('Search and Replace', () => {
    it('should find text positions correctly', () => {
      const text = 'Hello World, Hello Universe'
      const positions = TextService.findTextPositions(text, 'Hello')
      
      expect(positions).toEqual([0, 13])
    })

    it('should handle case-sensitive search', () => {
      const text = 'Hello hello HELLO'
      const positions = TextService.findTextPositions(text, 'hello')
      
      expect(positions).toEqual([6])
    })

    it('should handle case-insensitive search', () => {
      const text = 'Hello hello HELLO'
      const positions = TextService.findTextPositions(text, 'hello', false)
      
      expect(positions).toEqual([0, 6, 12])
    })

    it('should handle no matches', () => {
      const text = 'Hello World'
      const positions = TextService.findTextPositions(text, 'xyz')
      
      expect(positions).toEqual([])
    })

    it('should handle empty search term', () => {
      const text = 'Hello World'
      const positions = TextService.findTextPositions(text, '')
      
      expect(positions).toEqual([])
    })
  })

  describe('Text Analysis', () => {
    it('should identify empty text', () => {
      expect(TextService.isEmpty('')).toBe(true)
      expect(TextService.isEmpty('   ')).toBe(true)
      expect(TextService.isEmpty('\n\n')).toBe(true)
      expect(TextService.isEmpty('Hello')).toBe(false)
    })

    it('should identify single line text', () => {
      expect(TextService.isSingleLine('Hello World')).toBe(true)
      expect(TextService.isSingleLine('Hello\nWorld')).toBe(false)
      expect(TextService.isSingleLine('')).toBe(true)
    })

    it('should get text preview', () => {
      const longText = 'This is a very long text that should be truncated for preview purposes.'
      const preview = TextService.getTextPreview(longText, 20)
      
      expect(preview).toBe('This is a very long...')
      expect(preview.length).toBeLessThanOrEqual(23) // 20 + '...'
    })
  })
})
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HistoryItem } from '../../../src/components/history/HistoryItem'

describe('HistoryItem', () => {
  const mockItem = {
    index: 0,
    description: 'Insert Text: Hello World',
    executed: true,
    canUndo: true
  }

  const mockProps = {
    item: mockItem,
    isActive: true,
    isCurrent: false,
    theme: 'light' as const,
    onClick: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render item description', () => {
      render(<HistoryItem {...mockProps} />)
      
      expect(screen.getByText('Insert Text: Hello World')).toBeInTheDocument()
    })

    it('should display item index', () => {
      render(<HistoryItem {...mockProps} />)
      
      expect(screen.getByText('#1')).toBeInTheDocument()
    })

    it('should show correct status icon for active item', () => {
      render(<HistoryItem {...mockProps} />)
      
      expect(screen.getByText('✅')).toBeInTheDocument()
    })

    it('should show current indicator when isCurrent is true', () => {
      render(<HistoryItem {...mockProps} isCurrent={true} />)
      
      expect(screen.getByText('👉')).toBeInTheDocument()
    })

    it('should show inactive icon for non-executed item', () => {
      render(<HistoryItem {...mockProps} isActive={false} />)
      
      expect(screen.getByText('⚪')).toBeInTheDocument()
    })

    it('should show lock icon for non-undoable item', () => {
      const nonUndoableItem = { ...mockItem, canUndo: false }
      render(<HistoryItem {...mockProps} item={nonUndoableItem} />)
      
      expect(screen.getByText('🔒 固定')).toBeInTheDocument()
    })
  })

  describe('Description Formatting', () => {
    it('should truncate long descriptions', () => {
      const longItem = {
        ...mockItem,
        description: 'This is a very long description that should be truncated when displayed'
      }
      
      render(<HistoryItem {...mockProps} item={longItem} />)
      
      expect(screen.getByText('This is a very long descrip...')).toBeInTheDocument()
    })

    it('should not truncate short descriptions', () => {
      const shortItem = {
        ...mockItem,
        description: 'Short description'
      }
      
      render(<HistoryItem {...mockProps} item={shortItem} />)
      
      expect(screen.getByText('Short description')).toBeInTheDocument()
    })
  })

  describe('Theme Styling', () => {
    it('should apply light theme styles for current item', () => {
      const { container } = render(
        <HistoryItem {...mockProps} isCurrent={true} theme="light" />
      )
      
      const button = container.querySelector('button')
      expect(button).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('should apply dark theme styles for current item', () => {
      const { container } = render(
        <HistoryItem {...mockProps} isCurrent={true} theme="dark" />
      )
      
      const button = container.querySelector('button')
      expect(button).toHaveClass('bg-blue-600', 'text-white')
    })

    it('should apply light theme styles for active item', () => {
      const { container } = render(
        <HistoryItem {...mockProps} isActive={true} theme="light" />
      )
      
      const button = container.querySelector('button')
      expect(button).toHaveClass('bg-gray-100', 'text-gray-800')
    })

    it('should apply dark theme styles for active item', () => {
      const { container } = render(
        <HistoryItem {...mockProps} isActive={true} theme="dark" />
      )
      
      const button = container.querySelector('button')
      expect(button).toHaveClass('bg-gray-700', 'text-gray-200')
    })

    it('should apply light theme styles for inactive item', () => {
      const { container } = render(
        <HistoryItem {...mockProps} isActive={false} theme="light" />
      )
      
      const button = container.querySelector('button')
      expect(button).toHaveClass('bg-gray-50', 'text-gray-500')
    })

    it('should apply dark theme styles for inactive item', () => {
      const { container } = render(
        <HistoryItem {...mockProps} isActive={false} theme="dark" />
      )
      
      const button = container.querySelector('button')
      expect(button).toHaveClass('bg-gray-800', 'text-gray-400')
    })
  })

  describe('Click Handling', () => {
    it('should call onClick when clicked', () => {
      render(<HistoryItem {...mockProps} />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(mockProps.onClick).toHaveBeenCalledTimes(1)
    })

    it('should call onClick for inactive items too', () => {
      render(<HistoryItem {...mockProps} isActive={false} />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(mockProps.onClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Status Icon Logic', () => {
    it('should prioritize current indicator over active status', () => {
      render(<HistoryItem {...mockProps} isCurrent={true} isActive={true} />)
      
      expect(screen.getByText('👉')).toBeInTheDocument()
      expect(screen.queryByText('✅')).not.toBeInTheDocument()
    })

    it('should show active icon when not current but active', () => {
      render(<HistoryItem {...mockProps} isCurrent={false} isActive={true} />)
      
      expect(screen.getByText('✅')).toBeInTheDocument()
      expect(screen.queryByText('👉')).not.toBeInTheDocument()
    })

    it('should show inactive icon when not current and not active', () => {
      render(<HistoryItem {...mockProps} isCurrent={false} isActive={false} />)
      
      expect(screen.getByText('⚪')).toBeInTheDocument()
      expect(screen.queryByText('✅')).not.toBeInTheDocument()
      expect(screen.queryByText('👉')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should render as a button for keyboard navigation', () => {
      render(<HistoryItem {...mockProps} />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should have proper button structure for screen readers', () => {
      render(<HistoryItem {...mockProps} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Insert Text: Hello World')
      expect(button).toHaveTextContent('#1')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty description', () => {
      const emptyItem = { ...mockItem, description: '' }
      render(<HistoryItem {...mockProps} item={emptyItem} />)
      
      // コンポーネントがクラッシュしないことを確認
      expect(screen.getByText('#1')).toBeInTheDocument()
    })

    it('should handle negative index', () => {
      const negativeIndexItem = { ...mockItem, index: -1 }
      render(<HistoryItem {...mockProps} item={negativeIndexItem} />)
      
      expect(screen.getByText('#0')).toBeInTheDocument()
    })

    it('should handle large index', () => {
      const largeIndexItem = { ...mockItem, index: 999 }
      render(<HistoryItem {...mockProps} item={largeIndexItem} />)
      
      expect(screen.getByText('#1000')).toBeInTheDocument()
    })
  })

  describe('Multiple State Combinations', () => {
    it('should handle current + undoable item', () => {
      render(
        <HistoryItem 
          {...mockProps} 
          isCurrent={true} 
          item={{ ...mockItem, canUndo: true }} 
        />
      )
      
      expect(screen.getByText('👉')).toBeInTheDocument()
      expect(screen.queryByText('🔒 固定')).not.toBeInTheDocument()
    })

    it('should handle current + non-undoable item', () => {
      render(
        <HistoryItem 
          {...mockProps} 
          isCurrent={true} 
          item={{ ...mockItem, canUndo: false }} 
        />
      )
      
      expect(screen.getByText('👉')).toBeInTheDocument()
      expect(screen.getByText('🔒 固定')).toBeInTheDocument()
    })

    it('should handle inactive + non-undoable item', () => {
      render(
        <HistoryItem 
          {...mockProps} 
          isActive={false} 
          item={{ ...mockItem, canUndo: false }} 
        />
      )
      
      expect(screen.getByText('⚪')).toBeInTheDocument()
      expect(screen.getByText('🔒 固定')).toBeInTheDocument()
    })
  })
})
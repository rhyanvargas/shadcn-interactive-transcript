/**
 * Unit tests for TranscriptSegment component
 * Testing component rendering, interactions, and accessibility
 */

import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TranscriptSegment } from '../transcript-segment'
import { type TranscriptCue } from '@/lib/types/transcript'

// Mock transcript cue data
const mockCue: TranscriptCue = {
  id: 'cue-1',
  startTime: 30,
  endTime: 35,
  text: 'Hello world, this is a test transcript segment.',
  speaker: 'Alice'
}

const mockCueWithoutSpeaker: TranscriptCue = {
  id: 'cue-2',
  startTime: 60,
  endTime: 65,
  text: 'This segment has no speaker information.',
  speaker: undefined
}

describe('TranscriptSegment', () => {
  describe('basic rendering', () => {
    it('should render transcript segment with default props', () => {
      render(<TranscriptSegment cue={mockCue} />)
      
      expect(screen.getByText('Hello world, this is a test transcript segment.')).toBeInTheDocument()
      expect(screen.getByText('Alice:')).toBeInTheDocument()
      expect(screen.getByText('00:30')).toBeInTheDocument()
    })

    it('should render segment without speaker when not provided', () => {
      render(<TranscriptSegment cue={mockCueWithoutSpeaker} />)
      
      expect(screen.getByText('This segment has no speaker information.')).toBeInTheDocument()
      expect(screen.queryByText(/:/)).not.toBeInTheDocument()
    })

    it('should apply correct ARIA attributes', () => {
      render(<TranscriptSegment cue={mockCue} />)
      
      const segment = screen.getByRole('button')
      expect(segment).toHaveAttribute('aria-label', 'Transcript segment: Hello world, this is a test transcript segment. by Alice at 00:30')
      expect(segment).toHaveAttribute('aria-pressed', 'false')
      expect(segment).toHaveAttribute('tabIndex', '0')
    })

    it('should set data attributes correctly', () => {
      render(<TranscriptSegment cue={mockCue} />)
      
      const segment = screen.getByRole('button')
      expect(segment).toHaveAttribute('data-cue-id', 'cue-1')
      expect(segment).toHaveAttribute('data-start-time', '30')
      expect(segment).toHaveAttribute('data-end-time', '35')
    })
  })

  describe('component states', () => {
    it('should apply active state correctly', () => {
      render(<TranscriptSegment cue={mockCue} active />)
      
      const segment = screen.getByRole('button')
      expect(segment).toHaveAttribute('aria-pressed', 'true')
      expect(segment).toHaveClass('bg-accent', 'text-accent-foreground')
    })

    it('should apply highlighted state correctly', () => {
      render(<TranscriptSegment cue={mockCue} highlighted />)
      
      const segment = screen.getByRole('button')
      expect(segment).toHaveClass('bg-muted', 'text-foreground')
    })

    it('should apply search match state correctly', () => {
      render(<TranscriptSegment cue={mockCue} searchMatch />)
      
      const segment = screen.getByRole('button')
      expect(segment).toHaveClass('bg-yellow-100', 'font-medium')
    })

    it('should prioritize active state over other states', () => {
      render(<TranscriptSegment cue={mockCue} active highlighted searchMatch />)
      
      const segment = screen.getByRole('button')
      expect(segment).toHaveClass('bg-accent', 'text-accent-foreground')
    })
  })

  describe('component variants', () => {
    it('should apply size variants correctly', () => {
      const { rerender } = render(<TranscriptSegment cue={mockCue} size="sm" />)
      expect(screen.getByRole('button')).toHaveClass('px-2', 'py-1', 'text-xs')

      rerender(<TranscriptSegment cue={mockCue} size="lg" />)
      expect(screen.getByRole('button')).toHaveClass('px-4', 'py-3', 'text-base')
    })

    it('should apply variant styles correctly', () => {
      const { rerender } = render(<TranscriptSegment cue={mockCue} variant="ghost" />)
      expect(screen.getByRole('button')).toHaveClass('hover:bg-accent/30')

      rerender(<TranscriptSegment cue={mockCue} variant="outline" />)
      expect(screen.getByRole('button')).toHaveClass('border', 'border-input')
    })
  })

  describe('timestamp configuration', () => {
    it('should hide timestamp when configured', () => {
      render(
        <TranscriptSegment 
          cue={mockCue} 
          timestampConfig={{ show: false }} 
        />
      )
      
      expect(screen.queryByText('00:30')).not.toBeInTheDocument()
    })

    it('should position timestamp correctly', () => {
      const { rerender } = render(
        <TranscriptSegment 
          cue={mockCue} 
          timestampConfig={{ position: "right" }} 
        />
      )
      
      const timestamp = screen.getByText('00:30')
      expect(timestamp).toHaveClass('ml-1')

      rerender(
        <TranscriptSegment 
          cue={mockCue} 
          timestampConfig={{ position: "top" }} 
        />
      )
      
      expect(screen.getByText('00:30')).toHaveClass('mb-1')
    })

    it('should use custom timestamp formatter', () => {
      const customFormatter = (time: number) => `${time}s`
      
      render(
        <TranscriptSegment 
          cue={mockCue} 
          timestampConfig={{ format: customFormatter }} 
        />
      )
      
      expect(screen.getByText('30s')).toBeInTheDocument()
    })

    it('should show time range in title attribute', () => {
      render(<TranscriptSegment cue={mockCue} />)
      
      const timestamp = screen.getByText('00:30')
      expect(timestamp).toHaveAttribute('title', '00:30 - 00:35')
    })
  })

  describe('speaker configuration', () => {
    it('should hide speaker when configured', () => {
      render(
        <TranscriptSegment 
          cue={mockCue} 
          speakerConfig={{ show: false }} 
        />
      )
      
      expect(screen.queryByText('Alice:')).not.toBeInTheDocument()
    })

    it('should use custom speaker formatter', () => {
      const customFormatter = (speaker: string) => `[${speaker}]`
      
      render(
        <TranscriptSegment 
          cue={mockCue} 
          speakerConfig={{ format: customFormatter }} 
        />
      )
      
      expect(screen.getByText('[Alice]')).toBeInTheDocument()
    })

    it('should apply speaker style variants', () => {
      render(
        <TranscriptSegment 
          cue={mockCue} 
          speakerConfig={{ style: "muted" }} 
        />
      )
      
      const speaker = screen.getByText('Alice:')
      expect(speaker).toHaveClass('text-muted-foreground')
    })
  })

  describe('search functionality', () => {
    it('should highlight search matches in text', () => {
      render(
        <TranscriptSegment 
          cue={mockCue} 
          searchQuery="world" 
        />
      )
      
      const highlightedText = screen.getByText('world')
      expect(highlightedText.tagName).toBe('MARK')
      expect(highlightedText).toHaveClass('bg-yellow-200')
    })

    it('should handle case-insensitive search', () => {
      render(
        <TranscriptSegment 
          cue={mockCue} 
          searchQuery="HELLO" 
        />
      )
      
      const highlightedText = screen.getByText('Hello')
      expect(highlightedText.tagName).toBe('MARK')
    })

    it('should handle multiple search matches', () => {
      const cueWithRepeatedWord: TranscriptCue = {
        ...mockCue,
        text: 'This is a test and this is another test.'
      }
      
      render(
        <TranscriptSegment 
          cue={cueWithRepeatedWord} 
          searchQuery="test" 
        />
      )
      
      const highlights = screen.getAllByText('test')
      expect(highlights).toHaveLength(2)
      highlights.forEach(highlight => {
        expect(highlight.tagName).toBe('MARK')
      })
    })

    it('should not highlight when no search query provided', () => {
      render(<TranscriptSegment cue={mockCue} />)
      
      expect(screen.queryByTagName('mark')).not.toBeInTheDocument()
    })
  })

  describe('user interactions', () => {
    it('should call onCueClick when clicked', async () => {
      const user = userEvent.setup()
      const onCueClick = vi.fn()
      
      render(<TranscriptSegment cue={mockCue} onCueClick={onCueClick} />)
      
      await user.click(screen.getByRole('button'))
      
      expect(onCueClick).toHaveBeenCalledWith(mockCue)
    })

    it('should call onCueClick when Enter key is pressed', async () => {
      const user = userEvent.setup()
      const onCueClick = vi.fn()
      
      render(<TranscriptSegment cue={mockCue} onCueClick={onCueClick} />)
      
      const segment = screen.getByRole('button')
      segment.focus()
      await user.keyboard('{Enter}')
      
      expect(onCueClick).toHaveBeenCalledWith(mockCue)
    })

    it('should call onCueClick when Space key is pressed', async () => {
      const user = userEvent.setup()
      const onCueClick = vi.fn()
      
      render(<TranscriptSegment cue={mockCue} onCueClick={onCueClick} />)
      
      const segment = screen.getByRole('button')
      segment.focus()
      await user.keyboard(' ')
      
      expect(onCueClick).toHaveBeenCalledWith(mockCue)
    })

    it('should not call onCueClick for other keys', async () => {
      const user = userEvent.setup()
      const onCueClick = vi.fn()
      
      render(<TranscriptSegment cue={mockCue} onCueClick={onCueClick} />)
      
      const segment = screen.getByRole('button')
      segment.focus()
      await user.keyboard('{ArrowDown}')
      
      expect(onCueClick).not.toHaveBeenCalled()
    })

    it('should call custom onClick and onKeyDown handlers', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      const onKeyDown = vi.fn()
      
      render(
        <TranscriptSegment 
          cue={mockCue} 
          onClick={onClick}
          onKeyDown={onKeyDown}
        />
      )
      
      const segment = screen.getByRole('button')
      
      await user.click(segment)
      expect(onClick).toHaveBeenCalled()
      
      segment.focus()
      await user.keyboard('{Enter}')
      expect(onKeyDown).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should be focusable', () => {
      render(<TranscriptSegment cue={mockCue} />)
      
      const segment = screen.getByRole('button')
      segment.focus()
      
      expect(segment).toHaveFocus()
    })

    it('should have proper semantic time element', () => {
      render(<TranscriptSegment cue={mockCue} />)
      
      const timeElement = screen.getByText('00:30')
      expect(timeElement.tagName).toBe('TIME')
      expect(timeElement).toHaveAttribute('dateTime', '30s')
    })

    it('should have speaker aria-label', () => {
      render(<TranscriptSegment cue={mockCue} />)
      
      const speaker = screen.getByLabelText('Speaker: Alice')
      expect(speaker).toBeInTheDocument()
    })

    it('should support screen reader navigation', () => {
      render(<TranscriptSegment cue={mockCue} />)
      
      const segment = screen.getByRole('button')
      expect(segment).toHaveAttribute('role', 'button')
      expect(segment).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('asChild prop', () => {
    it('should render as child component when asChild is true', () => {
      render(
        <TranscriptSegment cue={mockCue} asChild>
          <article data-testid="custom-element" />
        </TranscriptSegment>
      )
      
      const customElement = screen.getByTestId('custom-element')
      expect(customElement.tagName).toBe('ARTICLE')
      expect(customElement).toHaveAttribute('role', 'button')
    })
  })

  describe('edge cases', () => {
    it('should handle empty text gracefully', () => {
      const emptyCue: TranscriptCue = {
        ...mockCue,
        text: ''
      }
      
      render(<TranscriptSegment cue={emptyCue} />)
      
      const segment = screen.getByRole('button')
      expect(segment).toBeInTheDocument()
    })

    it('should handle special characters in search', () => {
      const specialCharCue: TranscriptCue = {
        ...mockCue,
        text: 'Hello [world] with (special) characters!'
      }
      
      render(
        <TranscriptSegment 
          cue={specialCharCue} 
          searchQuery="[world]" 
        />
      )
      
      const highlightedText = screen.getByText('[world]')
      expect(highlightedText.tagName).toBe('MARK')
    })

    it('should handle very long timestamps', () => {
      const longTimeCue: TranscriptCue = {
        ...mockCue,
        startTime: 3661, // 1:01:01
        endTime: 3665
      }
      
      render(<TranscriptSegment cue={longTimeCue} />)
      
      expect(screen.getByText('61:01')).toBeInTheDocument()
    })
  })
})
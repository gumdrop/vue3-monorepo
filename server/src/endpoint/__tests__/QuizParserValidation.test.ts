import { describe, expect, it, vi } from 'vitest'
import type { QuizPaper } from '@quizleague/shared'
import { assertColumnLayout, assertParsedPaper, columnFor } from '../QuizParser'

vi.mock('../util', () => ({
  HttpError: class HttpError extends Error {
    constructor(
      public statusCode: number,
      message: string,
      public statusMessage = message,
    ) {
      super(message)
    }
  },
}))

const item = (x: number, str = 'text') => ({ str, x, y: 0 })

const question = (number: string, text = 'Question', answer = 'Answer') => ({
  number,
  question: text,
  answer,
})

const round = (name: string, questions: ReturnType<typeof question>[]) => ({
  round: name,
  questions,
})

describe('columnFor', () => {
  it('classifies the three Word table columns by x position', () => {
    expect(columnFor(0)).toBe('number')
    expect(columnFor(49)).toBe('number')
    expect(columnFor(50)).toBe('question')
    expect(columnFor(419)).toBe('question')
    expect(columnFor(420)).toBe('answer')
    expect(columnFor(900)).toBe('answer')
  })
})

describe('assertColumnLayout', () => {
  it('accepts a layout with all three columns and numbered questions', () => {
    expect(() =>
      assertColumnLayout([item(40, '1A'), item(120, 'What year?'), item(500, '1966')]),
    ).not.toThrow()
  })

  it('rejects a layout with an empty number column', () => {
    expect(() => assertColumnLayout([item(120, 'What year?'), item(500, '1966')])).toThrow(
      /template changed/,
    )
  })

  it('rejects a layout with an empty question column', () => {
    expect(() => assertColumnLayout([item(40, '1A'), item(500, '1966')])).toThrow(/template changed/)
  })

  it('rejects a layout with an empty answer column', () => {
    expect(() => assertColumnLayout([item(40, '1A'), item(120, 'What year?')])).toThrow(
      /template changed/,
    )
  })

  it('rejects a layout whose number column holds no digit-prefixed question numbers', () => {
    expect(() =>
      assertColumnLayout([item(40, 'ROUND ONE'), item(120, 'What year?'), item(500, '1966')]),
    ).toThrow(/template changed/)
  })
})

describe('assertParsedPaper', () => {
  it('accepts a well-formed paper', () => {
    const paper: QuizPaper = {
      rounds: [round('ROUND ONE', [question('1A'), question('1B')])],
    }
    expect(() => assertParsedPaper(paper)).not.toThrow()
  })

  it('accepts a paper whose tiebreak question has an empty number', () => {
    const paper: QuizPaper = {
      rounds: [round('ROUND ONE', [question('1A')]), round('TIEBREAK', [question('')])],
    }
    expect(() => assertParsedPaper(paper)).not.toThrow()
  })

  it('rejects a paper with no rounds', () => {
    expect(() => assertParsedPaper({ rounds: [] })).toThrow(/template changed/)
  })

  it('rejects a paper with an empty round name', () => {
    const paper: QuizPaper = { rounds: [round('', [question('1A')])] }
    expect(() => assertParsedPaper(paper)).toThrow(/template changed/)
  })

  it('rejects a paper with no numbered questions', () => {
    const paper: QuizPaper = { rounds: [round('TIEBREAK', [question('')])] }
    expect(() => assertParsedPaper(paper)).toThrow(/template changed/)
  })

  it('rejects a paper where most numbered questions are missing text', () => {
    const paper: QuizPaper = {
      rounds: [
        round('ROUND ONE', [question('1A', '', ''), question('2A', '', ''), question('3A')]),
      ],
    }
    expect(() => assertParsedPaper(paper)).toThrow(/template changed/)
  })

  it('tolerates a minority of malformed numbered questions', () => {
    const paper: QuizPaper = {
      rounds: [
        round('ROUND ONE', [question('1A', '', ''), question('2A'), question('3A')]),
      ],
    }
    expect(() => assertParsedPaper(paper)).not.toThrow()
  })
})

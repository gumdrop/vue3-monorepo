import { describe, expect, it, vi } from 'vitest'
import { parseQuizPaper } from '../QuizParser'
import { quizFixturePassword, quizFixturePdfBytes } from './quizFixture'

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

describe('parseQuizPaper', () => {
  it('reconstructs the quiz structure deterministically', async () => {
    const paper = await parseQuizPaper(quizFixturePdfBytes(), quizFixturePassword())
    const rounds = paper.rounds

    expect(rounds).toHaveLength(13)
    expect(rounds.map((round) => round.round)).toEqual([
      'ROUND ONE',
      'ROUND TWO',
      'ROUND THREE – INDIVIDUAL – PICK A SUBJECT',
      'ROUND FOUR',
      'ROUND FIVE',
      'ROUND SIX',
      'ROUND SEVEN',
      'ROUND EIGHT – INDIVIDUAL – PICK A SUBJECT',
      'ROUND NINE',
      'ROUND TEN',
      'SPARES A & B',
      'TWENTY SPARE QUESTIONS – BEER ROUND',
      'TIEBREAK',
    ])

    const roundThree = rounds[2]
    expect(roundThree.subjects).toEqual([
      'FILMS',
      'ENGLISH GEOGRAPHY',
      'FORMER COINS',
      'AUTOMOTIVE ENGINEERS',
    ])
    expect(roundThree.questions).toHaveLength(8)

    const roundEight = rounds[7]
    expect(roundEight.subjects).toEqual(['PHYSICS', 'RACEHORSES', 'FRENCH PAINTERS', 'MUSICALS'])

    expect(rounds[10].questions).toHaveLength(4) // spares
    expect(rounds[11].questions).toHaveLength(20) // beer round
    expect(rounds[12].questions).toHaveLength(1) // tiebreak
    expect(rounds[12].questions[0].number).toBe('')
  })

  it('preserves underlining in answers', async () => {
    const paper = await parseQuizPaper(quizFixturePdfBytes(), quizFixturePassword())
    const roundSeven = paper.rounds[6]

    const q1b = roundSeven.questions.find((q) => q.number === '1B')
    expect(q1b?.answer).toBe('The <u>Third</u> or <u>Eroica</u>')

    const q2a = roundSeven.questions.find((q) => q.number === '2A')
    expect(q2a?.answer).toContain('<u>Santiago</u>')
    expect(q2a?.answer).toContain('<u>Compostela</u>')
  })

  it('keeps round names and subjects free of underline markers', async () => {
    const paper = await parseQuizPaper(quizFixturePdfBytes(), quizFixturePassword())

    for (const round of paper.rounds) {
      expect(round.round).not.toContain('<u>')
      for (const subject of round.subjects ?? []) {
        expect(subject).not.toContain('<u>')
      }
    }
  })

  it('rejects an incorrect password', async () => {
    await expect(
      parseQuizPaper(quizFixturePdfBytes(), 'not-the-password'),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Incorrect password',
    })
  })
})

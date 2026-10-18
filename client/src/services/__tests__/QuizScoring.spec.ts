import { describe, expect, it } from 'vitest'
import {
  aSideForRound,
  applyOutcome,
  initialScore,
  isIndividualRound,
  isSecondHalf,
  jokerApplies,
  outcomePoints,
  owningSide,
  questionNumberPrefix,
  subjectForQuestion,
} from '../QuizScoring'

describe('QuizScoring', () => {
  describe('half and A-side ownership', () => {
    it('treats rounds 6-10 as the second half', () => {
      expect(isSecondHalf(5)).toBe(false)
      expect(isSecondHalf(6)).toBe(true)
      expect(isSecondHalf(10)).toBe(true)
    })

    it('defaults home to the A side in half 1 and swaps in half 2', () => {
      expect(aSideForRound(1)).toBe('home')
      expect(aSideForRound(5)).toBe('home')
      expect(aSideForRound(6)).toBe('away')
      expect(aSideForRound(10)).toBe('away')
    })

    it('respects a non-default first-half A designation', () => {
      expect(aSideForRound(1, false)).toBe('away')
      expect(aSideForRound(6, false)).toBe('home')
    })

    it('maps A/B suffixes to owning side with the half swap', () => {
      expect(owningSide(1, 'A')).toBe('home')
      expect(owningSide(1, 'B')).toBe('away')
      expect(owningSide(7, 'A')).toBe('away')
      expect(owningSide(7, 'B')).toBe('home')
    })
  })

  describe('outcome scoring', () => {
    it('scores correct as 2, bonus as 1, unanswered as 0', () => {
      expect(outcomePoints('correct')).toBe(2)
      expect(outcomePoints('bonus')).toBe(1)
      expect(outcomePoints('unanswered')).toBe(0)
    })

    it('doubles correct and bonus values on a joker, but not unanswered', () => {
      expect(outcomePoints('correct', true)).toBe(4)
      expect(outcomePoints('bonus', true)).toBe(2)
      expect(outcomePoints('unanswered', true)).toBe(0)
    })

    it('applies correct points to the owner', () => {
      expect(applyOutcome(initialScore, 'home', 'correct')).toEqual({ home: 2, away: 0 })
      expect(applyOutcome(initialScore, 'away', 'correct')).toEqual({ home: 0, away: 2 })
    })

    it('applies bonus points to the opposing team', () => {
      expect(applyOutcome(initialScore, 'home', 'bonus')).toEqual({ home: 0, away: 1 })
      expect(applyOutcome(initialScore, 'away', 'bonus')).toEqual({ home: 1, away: 0 })
    })

    it('leaves the score unchanged for unanswered', () => {
      expect(applyOutcome({ home: 5, away: 3 }, 'home', 'unanswered')).toEqual({ home: 5, away: 3 })
    })

    it('doubles a joker correct answer for the owner', () => {
      expect(applyOutcome(initialScore, 'home', 'correct', true)).toEqual({ home: 4, away: 0 })
    })

    it('doubles a joker bonus answer for the opposing team', () => {
      expect(applyOutcome(initialScore, 'home', 'bonus', true)).toEqual({ home: 0, away: 2 })
    })
  })

  describe('individual-round subject mapping', () => {
    const subjects = ['FILMS', 'ENGLISH GEOGRAPHY', 'FORMER COINS', 'AUTOMOTIVE ENGINEERS']

    it('maps a numeric prefix to the subject index', () => {
      expect(questionNumberPrefix('2A')).toBe(2)
      expect(questionNumberPrefix('1')).toBe(1)
      expect(questionNumberPrefix('')).toBe(0)
    })

    it('resolves subjects from the confirmed PDF ordering', () => {
      expect(subjectForQuestion('1A', subjects)).toBe('FILMS')
      expect(subjectForQuestion('2B', subjects)).toBe('ENGLISH GEOGRAPHY')
      expect(subjectForQuestion('3A', subjects)).toBe('FORMER COINS')
      expect(subjectForQuestion('4B', subjects)).toBe('AUTOMOTIVE ENGINEERS')
    })

    it('returns undefined for out-of-range or empty numbers', () => {
      expect(subjectForQuestion('5A', subjects)).toBeUndefined()
      expect(subjectForQuestion('', subjects)).toBeUndefined()
    })

    it('identifies individual rounds by the presence of subjects', () => {
      expect(isIndividualRound({ subjects })).toBe(true)
      expect(isIndividualRound({})).toBe(false)
      expect(isIndividualRound({ subjects: [] })).toBe(false)
    })
  })

  describe('joker applicability', () => {
    it('applies only when the scoring side nominated that category', () => {
      expect(jokerApplies('home', 'FILMS', { home: 'FILMS', away: 'GEOGRAPHY' })).toBe(true)
      expect(jokerApplies('home', 'FILMS', { home: 'GEOGRAPHY' })).toBe(false)
      expect(jokerApplies('away', 'FILMS', { home: 'FILMS', away: 'FILMS' })).toBe(true)
    })

    it('never applies when there is no category', () => {
      expect(jokerApplies('home', undefined, { home: 'FILMS' })).toBe(false)
    })
  })
})

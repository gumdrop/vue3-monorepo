import { describe, expect, it } from 'vitest'
import { availablePlayers } from '../QuizPlayers'

const all = ['Alice', 'Bob', 'Carol', 'Dave']

describe('availablePlayers', () => {
  it('offers every name when nothing has been selected yet', () => {
    expect(availablePlayers(['', '', '', ''], 0, all)).toEqual(all)
  })

  it('removes names chosen in other slots', () => {
    expect(availablePlayers(['Alice', '', '', ''], 1, all)).toEqual(['Bob', 'Carol', 'Dave'])
  })

  it('keeps the slot\'s own current value so it remains visible', () => {
    expect(availablePlayers(['Alice', '', '', ''], 0, all)).toEqual(all)
  })

  it('keeps a duplicated current value rather than corrupting existing state', () => {
    expect(availablePlayers(['Alice', 'Alice', '', ''], 0, all)).toEqual(all)
    expect(availablePlayers(['Alice', 'Alice', '', ''], 1, all)).toEqual(all)
  })

  it('treats cleared (null) values as empty', () => {
    expect(availablePlayers([null, 'Alice', '', ''], 0, all)).toEqual(['Bob', 'Carol', 'Dave'])
  })
})

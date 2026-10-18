import { afterEach, describe, expect, it, vi } from 'vitest'
import { acquireQuiz, resolveQuizPdfUrl } from '../QuizMasterFunctions'
import { parseQuizPaper } from '../QuizParser'

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

vi.mock('../QuizParser', () => ({
  parseQuizPaper: vi.fn(),
}))

const HOME = 'https://pantscat69er.wixsite.com/chiltern'
const PDF =
  'https://f31e691a-f542-49bf-8b4e-3f9ebe3071db.filesusr.com/ugd/9af7f9_e4dda457ca82493aa0af73422217d404.pdf'

const homeHtml = (date: string) =>
  `<a href="${HOME}/09-08-20-00">Quiz for ${date}</a>`

const subpageHtml = `<a href="${PDF}">Chiltern Quiz League</a>`

const stubFetch = (responses: Record<string, string>) => {
  const mock = vi.fn(async (url: string) => ({
    ok: true,
    status: 200,
    text: async () => responses[url] ?? '',
  }))
  vi.stubGlobal('fetch', mock)
  return mock
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('resolveQuizPdfUrl', () => {
  it('resolves the PDF URL for a DD/MM/YY button date', async () => {
    stubFetch({
      [HOME]: homeHtml('13/10/26'),
      [`${HOME}/09-08-20-00`]: subpageHtml,
    })

    await expect(resolveQuizPdfUrl('2026-10-13')).resolves.toBe(PDF)
  })

  it('resolves the PDF URL for a DD/MM/YYYY button date', async () => {
    stubFetch({
      [HOME]: homeHtml('13/10/2026'),
      [`${HOME}/09-08-20-00`]: subpageHtml,
    })

    await expect(resolveQuizPdfUrl('2026-10-13')).resolves.toBe(PDF)
  })

  it('throws quiz-not-found when no button matches the date', async () => {
    stubFetch({
      [HOME]: homeHtml('12/10/26'),
      [`${HOME}/09-08-20-00`]: subpageHtml,
    })

    await expect(resolveQuizPdfUrl('2026-10-13')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Quiz not found for this date',
    })
  })

  it('throws quiz-not-found when the subpage has no PDF link', async () => {
    stubFetch({
      [HOME]: homeHtml('13/10/26'),
      [`${HOME}/09-08-20-00`]: '<a href="/nowhere">No pdf</a>',
    })

    await expect(resolveQuizPdfUrl('2026-10-13')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Quiz PDF not found for this date',
    })
  })
})

describe('acquireQuiz', () => {
  it('resolves, downloads and parses the quiz PDF', async () => {
    const paper = { rounds: [] }
    vi.mocked(parseQuizPaper).mockResolvedValue(paper)

    const pdfBuffer = new Uint8Array([1, 2, 3]).buffer
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === HOME) return { ok: true, status: 200, text: async () => homeHtml('13/10/26') }
        if (url === `${HOME}/09-08-20-00`) {
          return { ok: true, status: 200, text: async () => subpageHtml }
        }
        if (url === PDF) {
          return { ok: true, status: 200, arrayBuffer: async () => pdfBuffer }
        }
        throw new Error(`Unexpected URL: ${url}`)
      }),
    )

    await expect(
      acquireQuiz({ fixtureDate: '2026-10-13', password: 'pw' }),
    ).resolves.toEqual(paper)
    expect(parseQuizPaper).toHaveBeenCalledWith(expect.any(Uint8Array), 'pw')
  })
})

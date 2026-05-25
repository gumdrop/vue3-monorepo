import { describe, expect, it } from 'vitest'
import { useValidations } from '../Validation'

describe('useValidations', () => {
  const { required, regex, isEmail } = useValidations()

  it('accepts provided values for required fields', () => {
    expect(required('Name')('Quiz Team')).toBe(true)
  })

  it('returns a field-specific message for missing required fields', () => {
    expect(required('Name')('')).toBe('Name is required')
    expect(required('Email')(undefined)).toBe('Email is required')
  })

  it('validates arbitrary regular expressions case-insensitively', () => {
    const validator = regex(/^abc$/, 'Must be abc')

    expect(validator('ABC')).toBe(true)
    expect(validator('abd')).toBe('Must be abc')
  })

  it('validates email addresses and reports the failing field name', () => {
    expect(isEmail('Contact')('alice@example.com')).toBe(true)
    expect(isEmail('Contact')('not-an-email')).toBe('Contact must be an email address')
  })
})

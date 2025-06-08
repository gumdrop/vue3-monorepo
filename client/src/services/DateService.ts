import {
  LocalDate,
  DateTimeFormatter,
  LocalTime,
  LocalDateTime,
  ZonedDateTime,
} from '@js-joda/core'
import '@js-joda/timezone'
import { Locale } from '@js-joda/locale_en-gb'

const DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE
const TIME_FORMAT = DateTimeFormatter.ISO_LOCAL_TIME
const DATE_TIME_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE_TIME
const ZONED_DATE_TIME_FORMAT = DateTimeFormatter.ISO_ZONED_DATE_TIME

export const useDateTime = () => {
  function date(value: string | undefined, format: string) {
    return value
      ? LocalDate.parse(value, DATE_FORMAT).format(
          DateTimeFormatter.ofPattern(format).withLocale(Locale.UK),
        )
      : undefined
  }

  function time(value: string | undefined, format: string) {
    return value
      ? LocalTime.parse(value, TIME_FORMAT).format(
          DateTimeFormatter.ofPattern(format).withLocale(Locale.UK),
        )
      : undefined
  }
  function datetime(value: string | undefined, format: string) {
    return value
      ? LocalDateTime.parse(value, DATE_TIME_FORMAT).format(
          DateTimeFormatter.ofPattern(format).withLocale(Locale.UK),
        )
      : undefined
  }

  function zoneddatetime(value: string | undefined, format: string) {
    return value
      ? ZonedDateTime.parse(value, ZONED_DATE_TIME_FORMAT).format(
          DateTimeFormatter.ofPattern(format).withLocale(Locale.UK),
        )
      : undefined
  }

  return { date, time, datetime, zoneddatetime }
}

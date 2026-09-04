export const useValidations = () => {
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/

  const required = (name: string) => (v: string | undefined) => {
    return v ? true : `${name} is required`
  }

  const regex = (regx: RegExp, message: string) => (v: string | undefined) => {
    return !v || v.toLowerCase().match(regx) ? true : message
  }

  const email = (name: string) => regex(emailRegex, `${name} must be an email address`)

  return { required, regex, isEmail: email }
}

import axios from 'axios'
import { REST_ROOT } from './constants'

export interface AliasEmailCommand {
  sender: string
  text: string
  alias: string
  captcha: ContactCaptchaResponse
}

export interface TeamEmailCommand {
  sender: string
  text: string
  teamId: string
  captcha: ContactCaptchaResponse
}

export interface ContactCaptchaChallenge {
  question: string
  token: string
}

export interface ContactCaptchaResponse {
  token: string
  answer: string
}

export const useContact = () => {
  const contactCaptchaChallenge = async () => {
    const response = await axios.get<ContactCaptchaChallenge>(`${REST_ROOT}/contact/captcha`)
    return response.data
  }

  const sendEmailToAlias = (
    sender: string,
    text: string,
    alias: string,
    captcha: ContactCaptchaResponse,
  ) => {
    const command: AliasEmailCommand = { sender, text, alias, captcha }

    return axios.post(`${REST_ROOT}/email/alias`, command, {
      headers: { 'Content-type': 'application/json' },
    })
  }

  const sendEmailToTeam = (
    sender: string,
    text: string,
    teamId: string,
    captcha: ContactCaptchaResponse,
  ) => {
    const command: TeamEmailCommand = { sender, text, teamId, captcha }

    return axios.post(`${REST_ROOT}/email/team`, command, {
      headers: { 'Content-type': 'application/json' },
    })
  }

  return { contactCaptchaChallenge, sendEmailToAlias, sendEmailToTeam }
}

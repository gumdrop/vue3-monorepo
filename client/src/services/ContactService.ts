import axios from 'axios'
import { REST_ROOT } from './constants'

export interface AliasEmailCommand {
  sender: string
  text: string
  alias: string
}

export interface TeamEmailCommand {
  sender: string
  text: string
  teamId: string
}

export const useContact = () => {
  const sendEmailToAlias = (sender: string, text: string, alias: string) => {
    const command: AliasEmailCommand = { sender, text, alias }

    return axios.post(`${REST_ROOT}/email/alias`, command, {
      headers: { 'Content-type': 'application/json' },
    })
  }

  const sendEmailToTeam = (sender: string, text: string, teamId: string) => {
    const command: TeamEmailCommand = { sender, text, teamId }

    return axios.post(`${REST_ROOT}/email/team`, command, {
      headers: { 'Content-type': 'application/json' },
    })
  }

  return { sendEmailToAlias, sendEmailToTeam }
}

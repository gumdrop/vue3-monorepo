import {parseParent} from '@quizleague/shared'
export const useKey = () => {


  function decode(encoded?: string) {
    return encoded ? encoded.replace(/\|/g, '/') : ''
  }

  function encode(key?: string) {
    return key ? key.replace(/\//g, '|') : ''
  }

  return { parseParent, decode, encode }
}

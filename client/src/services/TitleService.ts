import ApplicationContextDAO from '@/dao/ApplicationContextDAO'
import { getDoc } from 'firebase/firestore'

const useTitleService = () => {
  async function setTitle(title: string) {
    const appData = (await getDoc(ApplicationContextDAO.get())).data()
    document.title = `${appData?.leagueName} - ${title}`
  }
  return { setTitle }
}

export default useTitleService

import ApplicationContextDAO from '@/dao/ApplicationContextDAO'
import GlobalTextDAO from '@/dao/GlobalTextDAO'

export function useText() {
  async function getNamedTextId(name: string) {
    const appData = await ApplicationContextDAO.getAppContext()
    const globalText = await GlobalTextDAO.getData(appData?.textSet)
    return globalText?.text?.[name]?.id
  }

  return { getNamedTextId }
}

import DAO from '@/dao/DAO'
import { type ApplicationContext, SINGLETON_ID } from '@quizleague/shared'
import { GenericConverter } from './GenericConverter'

class ApplicationContextDAO extends DAO<ApplicationContext> {
  constructor() {
    super('applicationcontext')
  }

  override converter = new GenericConverter<ApplicationContext>()

  get = () => this.getById(SINGLETON_ID)

  getAppContext = () => this.getData(this.get())
}

export default new ApplicationContextDAO()

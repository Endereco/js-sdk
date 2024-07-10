import ActionInterface from './ActionInterface'

class DoAccounting extends ActionInterface {
  async execute (manager) {
    try {
      await manager.performDoAccounting()
      manager.syncSession()
    } catch (error) {
      console.error('Error during do accounting:', error)
    }
  }
}

export default DoAccounting

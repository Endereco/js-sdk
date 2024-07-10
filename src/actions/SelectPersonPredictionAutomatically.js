import ActionInterface from './ActionInterface'

class SelectPersonPredictionAutomatically extends ActionInterface {
  async execute (manager) {
    const selection = manager.meta.predictions[0]
    manager.assignAndSyncData(selection)
    manager.meta.hash = manager.cryptoService.createHash(selection)
    manager.assignFakeStatusCodes()
    manager.displayStatus()
    manager.displayErrorMessages()
    manager.syncMeta()
    return true
  }
}

export default SelectPersonPredictionAutomatically

import ActionInterface from './ActionInterface'

class CorrectAddressAutomatically extends ActionInterface {
  async execute (manager) {
    const address = manager.meta.predictions[0]
    manager.assignAndSyncData(address)
    manager.meta.hash = manager.cryptoService.createHash(
      manager.filterOutRelevantFields(address)
    )
    manager.assignFakeStatusCodes()
    manager.displayStatus()
    manager.displayErrorMessages()
    manager.syncMeta()
    return false
  }
}

export default CorrectAddressAutomatically

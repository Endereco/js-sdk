import ActionInterface from './ActionInterface'

class SelectAddressCorrectionAction extends ActionInterface {
  async execute (manager) {
    // Create a new Promise
    return new Promise((resolve, reject) => {
      manager.modalManager.displayAddressSelectionModal(
        manager.meta,
        (selection) => {
          manager.assignAndSyncData(selection)
          manager.meta.hash = manager.cryptoService.createHash(selection)
          manager.assignFakeStatusCodes()
          manager.displayStatus()
          manager.displayErrorMessages()
          manager.syncMeta()
          resolve()
        },
        () => {
          manager.meta.status.push('address_selected_by_customer')
          manager.displayStatus()
          manager.displayErrorMessages()
          manager.syncMeta()
          resolve()
        },
        () => {
          manager.setIntent('edit')
          reject({ reason: 'edit' })
        },
        () => {
          manager.setIntent('edit')
          reject({ reason: 'close' })
        }
      )
    })
  }
}

export default SelectAddressCorrectionAction

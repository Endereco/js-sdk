import ActionInterface from './ActionInterface'

class ConfirmAddressAction extends ActionInterface {
  async execute (manager) {
    // Create a new Promise
    return new Promise((resolve, reject) => {
      manager.modalManager.displayAddressReviewModal(
        manager.meta,
        () => {
          manager.meta.status.push('address_selected_by_customer')
          manager.displayStatus()
          manager.displayErrorMessages()
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

export default ConfirmAddressAction

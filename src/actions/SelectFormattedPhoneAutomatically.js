import PhoneDataManager from '../PhoneDataManager'
import ActionInterface from './ActionInterface'

class SelectFormattedPhoneAutomatically extends ActionInterface {
  async execute (manager) {
    if (!(manager instanceof PhoneDataManager)) {
      throw new TypeError('Invalid manager: Must be an instance of PhoneDataManager')
    }
    const selection = manager.meta.predictions[0]
    const fakeSelection = {
      countryCode: manager.data.countryCode,
      phone: selection.phone
    }
    switch (manager.other.dataFormat.toUpperCase()) {
      case 'E164': 
        fakeSelection.phone = selection.formatE164
        break;
      case 'INTERNATIONAL':
        fakeSelection.phone = selection.formatInternational
        break;
      case 'NATIONAL':
        fakeSelection.phone = selection.formatNational
        break;
    }
    manager.assignAndSyncData(fakeSelection)
    manager.meta.hash = manager.cryptoService.createHash(fakeSelection)
    manager.assignFakeStatusCodes()
    manager.displayStatus()
    manager.displayErrorMessages()
    manager.syncMeta()
    return true
  }
}

export default SelectFormattedPhoneAutomatically

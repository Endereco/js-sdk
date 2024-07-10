import AddressDataManager from '../AddressDataManager'
import RuleInterface from './RuleInterface'

class ManualAddressConfirmationNeeded extends RuleInterface {
  evaluate (addressDataManager) {
    if (!(addressDataManager instanceof AddressDataManager)) {
      throw new TypeError('Invalid manager: Must be an instance of AddressManager')
    }
    const { data, meta, cryptoService } = addressDataManager
    const relevantAddressPart = addressDataManager.filterOutRelevantFields(data)

    if (!data || !meta || !cryptoService) {
      throw new Error('AddressManager properties are missing')
    }

    const isAddressCheckResultUpToDate = cryptoService.compareHash(meta.hash, relevantAddressPart)
    const isNotFound =
      meta.status.includes('address_not_found') ||
      meta.status.includes('building_number_is_missing') ||
      meta.status.includes('building_number_not_found')
    const isAlreadyConfirmed = meta.status.includes('address_selected_by_customer')
    const isIntentReview = addressDataManager.intent === 'review'

    console.log(this.constructor.name + ' Evaluation', isAddressCheckResultUpToDate && !isAlreadyConfirmed && isNotFound && isIntentReview)

    return isAddressCheckResultUpToDate && !isAlreadyConfirmed && isNotFound && isIntentReview
  }
}

export default ManualAddressConfirmationNeeded

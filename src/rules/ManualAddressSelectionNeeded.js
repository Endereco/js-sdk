import AddressDataManager from '../AddressDataManager'
import RuleInterface from './RuleInterface'

class ManualAddressSelectionNeeded extends RuleInterface {
  evaluate (addressDataManager) {
    if (!(addressDataManager instanceof AddressDataManager)) {
      throw new TypeError('Invalid manager: Must be an instance of addressDataManager')
    }
    const { data, meta, cryptoService } = addressDataManager
    const relevantAddressPart = addressDataManager.filterOutRelevantFields(data)

    if (!data || !meta || !cryptoService) {
      throw new Error('addressDataManager properties are missing')
    }

    const isAddressCheckResultUpToDate = cryptoService.compareHash(meta.hash, relevantAddressPart)
    const isMajorCorrection =
      meta.status.includes('address_needs_correction') &&
      !meta.status.includes('address_minor_correction') &&
      !(meta.status.includes('building_number_is_missing') || meta.status.includes('building_number_not_found'))

    const hasMultipleResults = meta.status.includes('address_multiple_variants')
    const isAlreadyConfirmed = meta.status.includes('address_selected_by_customer')
    const isIntentReview = addressDataManager.intent === 'review'

    
    const evaluationResult = isAddressCheckResultUpToDate && !isAlreadyConfirmed && (isMajorCorrection || hasMultipleResults) && isIntentReview;

    console.log(this.constructor.name + ' Evaluation', {
      'isAddressCheckResultUpToDate': isAddressCheckResultUpToDate,
      'isMajorCorrection': isMajorCorrection,
      'hasMultipleResults': hasMultipleResults,
      'isAlreadyConfirmed': isAlreadyConfirmed,
      'isIntentReview': isIntentReview
    })
    
    return evaluationResult
  }
}

export default ManualAddressSelectionNeeded

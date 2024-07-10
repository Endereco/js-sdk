import AddressDataManager from '../AddressDataManager'
import RuleInterface from './RuleInterface'

class AutomaticAddressSelectionPossible extends RuleInterface {
  countOfChecks = new Map()

  evaluate (addressDataManager) {
    if (!(addressDataManager instanceof AddressDataManager)) {
      throw new TypeError('Invalid manager: Must be an instance of addressDataManager')
    }
    const { data, meta, cryptoService } = addressDataManager
    const relevantAddressPart = addressDataManager.filterOutRelevantFields(data)

    if (!data || !meta || !cryptoService) {
      throw new Error('addressDataManager properties are missing')
    }

    const checkCount = this.countOfChecks.get(meta.hash) || 1

    const isAddressCheckResultUpToDate = cryptoService.compareHash(meta.hash, relevantAddressPart)
    const isMinorCorrection = meta.status.includes('address_minor_correction')
    const isAlreadyConfirmed = meta.status.includes('address_selected_by_customer')
    const isIntentReview = addressDataManager.intent === 'review'
    const isCheckedAgain = checkCount > 1

    const evaluationResult = isAddressCheckResultUpToDate && !isAlreadyConfirmed && isMinorCorrection && isIntentReview && !isCheckedAgain;

    console.log(this.constructor.name + ' Evaluation', {
      'evaluationResult': evaluationResult,
      'isAddressCheckResultUpToDate': isAddressCheckResultUpToDate,
      'isAlreadyConfirmed': isAlreadyConfirmed,
      'isMinorCorrection': isMinorCorrection,
      'isIntentReview': isIntentReview,
      'isCheckedAgain': isCheckedAgain
    })
    
    this.countOfChecks.set(meta.hash, checkCount + 1)

    return evaluationResult
  }
}

export default AutomaticAddressSelectionPossible

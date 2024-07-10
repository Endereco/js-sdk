import AddressDataManager from '../AddressDataManager'
import RuleInterface from './RuleInterface'

class StreetIntegrityViolated extends RuleInterface {
  evaluate (addressDataManager) {
    if (!(addressDataManager instanceof AddressDataManager)) {
      throw new TypeError('Invalid manager: Must be an instance of AddressDataManager')
    }
    const isViolated = !addressDataManager.isStreetIntegrityMaintained(addressDataManager.data)

    console.log(this.constructor.name + ' Evaluation', isViolated)

    return isViolated
  }
}

export default StreetIntegrityViolated

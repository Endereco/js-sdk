import PhoneDataManager from '../PhoneDataManager'
import RuleInterface from './RuleInterface'

class PhoneFormatNeedsCorrection extends RuleInterface {
  countOfChecks = new Map()

  evaluate (manager) {
    if (!(manager instanceof PhoneDataManager)) {
      throw new TypeError('Invalid manager: Must be an instance of PhoneDataManager')
    }

    const { meta } = manager
    
    if (!this.countOfChecks.has(meta.hash)) {
      this.countOfChecks.set(meta.hash, 0)
    }
    let counter = this.countOfChecks.get(meta.hash)
    const hasStatus = meta.status.includes('phone_format_needs_correction')
    const isIntentReview = manager.intent === 'review'
    counter++
    this.countOfChecks.set(meta.hash, counter)

    console.log('Evaluate PhoneFormatNeedsCorrection', hasStatus, isIntentReview, (counter < 2), counter, meta.status)

    return hasStatus && isIntentReview && (counter < 2)
  }
}

export default PhoneFormatNeedsCorrection

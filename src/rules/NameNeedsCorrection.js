import PersonDataManager from '../PersonDataManager'
import RuleInterface from './RuleInterface'

class NameNeedsCorrection extends RuleInterface {
  countOfChecks = new Map()

  evaluate (manager) {
    if (!(manager instanceof PersonDataManager)) {
      throw new TypeError('Invalid manager: Must be an instance of PersonDataManager')
    }
    const { data, meta, cryptoService } = manager

    if (!data || !meta || !cryptoService) {
      throw new Error('manager properties are missing')
    }

    if (!this.countOfChecks.has(meta.hash)) {
      this.countOfChecks.set(meta.hash, 0)
    }
    let counter = this.countOfChecks.get(meta.hash)
    const hasStatus = meta.status.includes('name_needs_correction')
    const isIntentReview = manager.intent === 'review'
    counter++
    this.countOfChecks.set(meta.hash, counter)

    console.log('Evaluate NameNeedsCorrection', hasStatus, isIntentReview, (counter < 2), counter, meta.status)

    return hasStatus && isIntentReview && (counter < 2)
  }
}

export default NameNeedsCorrection

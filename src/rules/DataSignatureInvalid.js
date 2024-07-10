import DataManager from '../DataManager'
import RuleInterface from './RuleInterface'

class DataSignatureInvalid extends RuleInterface {
  evaluate (dataManager) {
    if (!(dataManager instanceof DataManager)) {
      throw new TypeError('Invalid dataManager: Must be an instance of DataManager')
    }

    const { data, meta, cryptoService } = dataManager
    const relevantAddressParts = dataManager.filterOutRelevantFields(data)

    if (!data || !meta || !cryptoService) {
      throw new Error('DataManager properties are missing')
    }

    const isDataHashUpToDate = cryptoService.compareHash(meta.hash, relevantAddressParts)

    console.log(this.constructor.name + ' Evaluation', {
      'isDataHashUpToDate': isDataHashUpToDate,
      'context': {
        'meta.hash': meta.hash,
        'relevantAddressParts': relevantAddressParts
      }
    })

    return !isDataHashUpToDate
  }
}

export default DataSignatureInvalid

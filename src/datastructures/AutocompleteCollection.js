import DataCollection from './DataCollection'

class AutocompleteCollection extends DataCollection {
  constructor (data = [], fieldName, originalData) {
    super(data)
    this.fieldName = fieldName
    this.originalData = originalData
  }
}

export default AutocompleteCollection

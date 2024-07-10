import StreetIntegrityViolated from './rules/StreetIntegrityViolated'
import EnsureStreetIntegrity from './actions/EnsureStreetIntegrity'
import ManualAddressSelectionNeeded from './rules/ManualAddressSelectionNeeded'
import SelectAddressCorrectionAction from './actions/SelectAddressCorrectionAction'
import ManualAddressConfirmationNeeded from './rules/ManualAddressConfirmationNeeded'
import ConfirmAddressAction from './actions/ConfirmAddressAction'
import HasAccountableSession from './rules/HasAccountableSession'
import DoAccounting from './actions/DoAccounting'
import AutocompleteCollection from './datastructures/AutocompleteCollection'
import DataManager from './DataManager'
import DataSignatureInvalid from './rules/DataSignatureInvalid'
import ValidateData from './actions/ValidateData'
import AutomaticAddressSelectionPossible from './rules/AutomaticAddressSelectionPossible'
import CorrectAddressAutomatically from './actions/CorrectAddressAutomatically'

class AddressDataManager extends DataManager {
  autocompletableFields = ['postalCode', 'locality', 'streetName', 'streetFull']
  name = ''

  autocompleteCacheRegistry = {
    postalCode: new Map(),
    locality: new Map()
  }

  streetModus = 'streetName'

  constructor (configService, filterService, apiService, cryptoService, modalManager, formManager, statusService) {
    super(configService, filterService, apiService, cryptoService, modalManager, formManager, statusService)

    this.data = {
      countryCode: '',
      subdivisionCode: '',
      postalCode: '',
      locality: '',
      streetFull: '',
      streetName: '',
      buildingNumber: '',
      additionalInfo: ''
    }

    this.meta = {
      type: 'address',
      status: [],
      predictions: [],
      hash: ''
    }

    this.initRoutine()
  }

  addRulesActions () {
    this.addRegularRuleAndAction(
      new StreetIntegrityViolated(),
      new EnsureStreetIntegrity()
    )

    this.addRegularRuleAndAction(
      new DataSignatureInvalid(),
      new ValidateData()
    )

    this.addRegularRuleAndAction(
      new ManualAddressSelectionNeeded(),
      new SelectAddressCorrectionAction()
    )

    this.addRegularRuleAndAction(
      new ManualAddressConfirmationNeeded(),
      new ConfirmAddressAction()
    )

    this.addRegularRuleAndAction(
      new AutomaticAddressSelectionPossible(),
      new CorrectAddressAutomatically()
    )

    this.addFinalRuleAndAction(
      new HasAccountableSession(),
      new DoAccounting()
    )
  }

  setModus () {
    this.setStreetModus()
  }

  setStreetModus (streetModus = null) {
    if (!streetModus) {
      streetModus = this.formManager.getStreetModus()
    }

    this.streetModus = streetModus
  }

  filterOutRelevantFields (data) {
    if (!data) {
      data = this.data
    }
    data = JSON.parse(JSON.stringify(data));
    if (this.streetModus === 'streetFull') {
      delete data.streetName
      delete data.buildingNumber
    } else {
      delete data.streetFull
    }

    return data;
  }

  afterValueInputFieldSetRoutine (change) {
    if (change.active && this.autocompletableFields.includes(change.key)) {
      switch (change.key) {
        case 'postalCode':
          this.displayCachedPredictions(this.data, change.key)
          this.apiService.getPostalCodePredictions(this.data, this.session)
            .then(this.processAutocompleteResult.bind(this))
            .catch(this.apiService.handleError)
          break
        case 'locality':
          this.displayCachedPredictions(this.data, change.key)
          this.apiService.getLocalityPredictions(this.data, this.session)
            .then(this.processAutocompleteResult.bind(this))
            .catch(this.apiService.handleError)
          break
        case 'streetName':
          this.displayCachedPredictions(this.data, change.key)
          this.apiService.getStreetNamePredictions(this.data, this.session)
            .then(this.processAutocompleteResult.bind(this))
            .catch(this.apiService.handleError)
          break
        case 'streetFull':
          this.displayCachedPredictions(this.data, change.key)
          this.apiService.getStreetFullPredictions(this.data, this.session)
            .then(this.processAutocompleteResult.bind(this))
            .catch(this.apiService.handleError)
          break
      }
    }
  }

  displayCachedPredictions (address, fieldName) {
    const cache = this.autocompleteCacheRegistry[fieldName]
    if (!cache) {
      return
    }

    const originalInput = address[fieldName]
    if (originalInput.length < 3) {
      return
    }

    const countryCode = address.countryCode ?? 'DE'
    const predictions = cache.get(countryCode) ?? []

    const filteredPredictions = predictions.filter(prediction =>
      prediction[fieldName].startsWith(originalInput)
    )

    if (filteredPredictions.length > 0) {
      const autocompleteCollection = new AutocompleteCollection(filteredPredictions, fieldName, address)
      this.formManager.displayAutocompleteDropdown(fieldName, autocompleteCollection)
    }
  }

  updatePredictionCache (fieldName, address, predictions) {
    const cache = this.autocompleteCacheRegistry[fieldName]
    if (!cache) {
      return
    }
    const countryCode = address.countryCode.toUpperCase()
    const cachedPredictions = cache.get(countryCode) ?? []
    const predictionsToCache = [...cachedPredictions]

    predictions.forEach(prediction => {
      if (!predictionsToCache.some(p => JSON.stringify(p) === JSON.stringify(prediction))) {
        predictionsToCache.push(prediction)
      }
    })

    cache.set(countryCode, predictionsToCache)
  }

  async splitStreet (address = null) {
    if (!address) {
      address = this.data
    }
    return this.apiService.splitStreet(address)
  }

  buildStreetFull (address = null) {
    if (!address) {
      address = this.data
    }
    const { streetName, buildingNumber, countryCode } = address
    const countries = [
      'fr', 'us', 'dz', 'ad', 'az', 'am', 'au', 'bh', 'bd', 'bn', 'kh', 'ca', 'cn', 'cx', 'cc', 'cd',
      'cg', 'ck', 'cy', 'ci', 'dm', 'eg', 'fj', 'ga', 'gm', 'ge', 'gh', 'gi', 'gp', 'gu', 'gy', 'hk',
      'in', 'id', 'ie', 'gb', 'il', 'la', 'lb', 'lu', 'mr', 'mu', 'mc', 'ms', 'ma', 'mm', 'na', 'nz',
      'ng', 'nf', 'om', 'pk', 'pw', 'ph', 'pr', 'rw', 're', 'bl', 'sh', 'kn', 'mf', 'sa', 'sn', 'sl',
      'sg', 'tw', 'tz', 'th', 'tg', 'tt', 'tn', 'tm', 'tc', 'vn', 'wf', 'ye', 'zm', 'zw'
    ]

    const normalizedCountryCode = countryCode.toLowerCase()

    let streetFull
    if (countries.includes(normalizedCountryCode)) {
      streetFull = `${buildingNumber} ${streetName}`
    } else {
      streetFull = `${streetName} ${buildingNumber}`
    }

    return streetFull
  }

  async ensureStreetIntegrity () {
    switch (this.streetModus) {
      case 'streetFull':
        const { streetName, buildingNumber } = await this.splitStreet()
        this.data.streetName = streetName
        this.data.buildingNumber = buildingNumber
        this.formManager.valueHandler.setFieldValue('streetName', streetName)
        this.formManager.valueHandler.setFieldValue('buildingNumber', buildingNumber)
        break
      case 'streetName':
        const streetFull = this.buildStreetFull()
        this.data.streetFull = streetFull
        this.formManager.valueHandler.setFieldValue('streetFull', streetFull)
        break
    }
  }

  processAutocompleteResult (autocompleteCollection) {
    if (!autocompleteCollection.isValid) {
      return
    }

    this.syncSession()

    // Cache if there is cache
    const address = autocompleteCollection.originalData
    const fieldName = autocompleteCollection.fieldName
    this.updatePredictionCache(fieldName, address, autocompleteCollection.items)
    this.formManager.displayAutocompleteDropdown(fieldName, autocompleteCollection)
  }

  isStreetIntegrityMaintained (address) {
    const { streetFull, streetName, buildingNumber } = address

    if (typeof streetFull !== 'string' || typeof streetName !== 'string' || typeof buildingNumber !== 'string') {
      throw new Error('All fields must be strings')
    }

    const trimmedStreetFull = streetFull.trim()
    const trimmedStreetName = streetName.trim()
    const trimmedBuildingNumber = buildingNumber.trim()

    if (trimmedStreetFull === '' && (trimmedStreetName !== '' || trimmedBuildingNumber !== '')) {
      return false
    }

    if (trimmedStreetFull !== '' && trimmedStreetName === '') {
      return false
    }

    const isStreetNameInFull = trimmedStreetFull.includes(trimmedStreetName)
    const isBuildingNumberInFull = trimmedStreetFull.includes(trimmedBuildingNumber)

    return isStreetNameInFull && isBuildingNumberInFull
  }

  async validateData (address = null) {
    if (!address) {
      address = this.filterOutRelevantFields(this.data)
    }
    this.setIntent('review')
    return this.apiService.checkAddress(address, this.session)
  }
}

export default AddressDataManager

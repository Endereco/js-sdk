import axios from 'axios'
import CryptoService from './CryptoService'
import MappingService from './MappingService'
import ConfigService from './ConfigService'
import AutocompleteCollection from './datastructures/AutocompleteCollection'
import FilterService from './FilterService'

class ApiService {
  constructor (configService, filterService, cryptoService, mappingService) {
    if (!(configService instanceof ConfigService)) {
      throw new TypeError('Invalid configService: Must be an instance of ConfigService')
    }
    if (!(filterService instanceof FilterService)) {
      throw new TypeError('Invalid filterService: Must be an instance of FilterService')
    }
    if (!(cryptoService instanceof CryptoService)) {
      throw new TypeError('Invalid cryptoService: Must be an instance of CryptoService')
    }
    if (!(mappingService instanceof MappingService)) {
      throw new TypeError('Invalid mappingService: Must be an instance of MappingService')
    }
    this.configService = configService
    this.filterService = filterService
    this.cryptoService = cryptoService
    this.mappingService = mappingService

    this.counters = {
      postalCodeAutocomplete: 0,
      localityAutocomplete: 0,
      streetAutocomplete: 0,
      streetFullAutocomplete: 0,
      addressCheck: 0,
      personCheck: 0,
      emailCheck: 0,
      phoneCheck: 0
    }
  }

  #getHeaders (apiConfig, session) {
    return {
      'X-Auth-Key': apiConfig.apiKey,
      'X-Agent': apiConfig.clientName,
      'X-Remote-Api-Url': apiConfig.apiUrl,
      'X-Transaction-Referer': window.location.href,
      'X-Transaction-Id': session.sessionId ?? 'not_required'
    }
  }

  async #sendRequest (message, session) {
    const apiConfig = this.configService.getConfig('api')
    try {
      const response = await axios.post(
        apiConfig.proxyUrl,
        message,
        {
          timeout: apiConfig.requestTimeout,
          headers: this.#getHeaders(apiConfig, session)
        }
      )
      if (session.sessionId) {
        session.sessionCounter++
      }
      return response.data
    } catch (error) {
      this.handleError(error)
      throw error
    }
  }

  async getPostalCodePredictions (address, session) {
    this.counters.postalCodeAutocomplete++
    const message = {
      jsonrpc: '2.0',
      id: this.counters.postalCodeAutocomplete,
      method: 'postCodeAutocomplete',
      params: {
        country: address.countryCode,
        language: 'de',
        postCode: address.postalCode,
        cityName: address.locality,
        street: address.streetName,
        houseNumber: address.buildingNumber
      }
    }

    const data = await this.#sendRequest(message, session)
    const predictions = data.result.predictions.map(prediction =>
      this.mappingService.mapParamFieldsToNew(prediction)
    )

    const collection = new AutocompleteCollection(predictions, 'postalCode', address)
    if (data.id !== this.counters.postalCodeAutocomplete) {
      collection.invalidate()
    }

    return collection
  }

  async getLocalityPredictions (address, session) {
    this.counters.localityAutocomplete++
    const message = {
      jsonrpc: '2.0',
      id: this.counters.localityAutocomplete,
      method: 'cityNameAutocomplete',
      params: {
        country: address.countryCode,
        language: 'de',
        postCode: address.postalCode,
        cityName: address.locality,
        street: address.streetName,
        houseNumber: address.buildingNumber
      }
    }

    const data = await this.#sendRequest(message, session)
    const predictions = data.result.predictions.map(prediction =>
      this.mappingService.mapParamFieldsToNew(prediction)
    )

    const collection = new AutocompleteCollection(predictions, 'locality', address)
    if (data.id !== this.counters.localityAutocomplete) {
      collection.invalidate()
    }

    return collection
  }

  async getStreetNamePredictions (address, session) {
    this.counters.streetAutocomplete++
    const message = {
      jsonrpc: '2.0',
      id: this.counters.streetAutocomplete,
      method: 'streetAutocomplete',
      params: {
        country: address.countryCode,
        language: 'de',
        postCode: address.postalCode,
        cityName: address.locality,
        street: address.streetName,
        houseNumber: address.buildingNumber,
        additionalInfo: address.additionalInfo
      }
    }

    const data = await this.#sendRequest(message, session)
    const predictions = data.result.predictions.map(prediction =>
      this.mappingService.mapParamFieldsToNew(prediction)
    )

    const collection = new AutocompleteCollection(predictions, 'streetName', address)
    if (data.id !== this.counters.streetAutocomplete) {
      collection.invalidate()
    }

    return collection
  }

  async getStreetFullPredictions (address, session) {
    this.counters.streetFullAutocomplete++
    const message = {
      jsonrpc: '2.0',
      id: this.counters.streetFullAutocomplete,
      method: 'streetAutocomplete',
      params: {
        country: address.countryCode,
        language: 'de',
        postCode: address.postalCode,
        cityName: address.locality,
        streetFull: address.streetFull,
        additionalInfo: address.additionalInfo
      }
    }

    const data = await this.#sendRequest(message, session)
    const predictions = data.result.predictions.map(prediction => {
      const mappedPrediction = this.mappingService.mapParamFieldsToNew(prediction)
      if (!mappedPrediction.hasOwnProperty('streetFull')) {
        this.enrichWithStreetFull(address.streetFull, mappedPrediction)
      }
      return mappedPrediction
    })

    const collection = new AutocompleteCollection(predictions, 'streetFull', address)
    if (data.id !== this.counters.streetFullAutocomplete) {
      collection.invalidate()
    }

    return collection
  }

  async checkAddress (address, session) {
    this.counters.addressCheck++
    const addressParams = this.mappingService.mapParamFieldsToOld(address)
    const message = {
      jsonrpc: '2.0',
      id: this.counters.addressCheck,
      method: 'addressCheck',
      params: {
        language: 'de',
        ...addressParams
      }
    }

    const data = await this.#sendRequest(message, session)
    let { status, predictions } = data.result
    predictions = predictions.map(prediction =>
      this.mappingService.mapParamFieldsToNew(prediction)
    )

    if (Object.keys(address).includes('streetFull')) {
      predictions.forEach(prediction => {
        if (!prediction.hasOwnProperty('streetFull')) {
          this.enrichWithStreetFull(address.streetFull, prediction)
          delete prediction.streetName
          delete prediction.buildingNumber
        }
      })
    }

    predictions.forEach(prediction => {
      if (prediction.hasOwnProperty('countryCode')) {
        prediction.countryCode = prediction.countryCode.toUpperCase()
      }
    })

    return {
      valid: data.id === this.counters.addressCheck,
      meta: {
        status,
        type: 'address',
        predictions,
        hash: this.cryptoService.createHash(address),
        originalInput: address
      }
    }
  }

  async doAccounting(session) {
    if (session.sessionCounter == 0) {
      return;
    }
    const message = {
      jsonrpc: '2.0',
      id: 1,
      method: 'doAccounting',
      params: {
        sessionId: session.sessionId
      }
    }
    await this.#sendRequest(message, session)
    return
  }

  async checkPhone (phone, other, session) {
    this.counters.phoneCheck++
    const params = JSON.parse(JSON.stringify(phone))

    if (other.dataFormat !== '') {
      params.format = other.dataFormat
    }

    const message = {
      jsonrpc: '2.0',
      id: this.counters.phoneCheck,
      method: 'phoneCheck',
      params: {
        ...params
      }
    }

    const data = await this.#sendRequest(message, session)
    let { status, predictions } = data.result
    if (!predictions) {
      predictions = []
    }

    predictions = predictions.map(prediction =>
      this.mappingService.mapParamFieldsToNew(prediction)
    )

    return {
      valid: data.id === this.counters.phoneCheck,
      meta: {
        status,
        validationCounter: this.counters.phoneCheck,
        type: 'phone',
        predictions,
        hash: this.cryptoService.createHash(phone),
        originalInput: phone
      }
    }
  }

  async checkEmail (email, session) {
    this.counters.emailCheck++
    const params = this.mappingService.mapParamFieldsToOld(email)
    const message = {
      jsonrpc: '2.0',
      id: this.counters.emailCheck,
      method: 'emailCheck',
      params: {
        ...params
      }
    }

    const data = await this.#sendRequest(message, session)
    let { status, predictions } = data.result
    if (!predictions) {
      predictions = []
    }

    predictions = predictions.map(prediction =>
      this.mappingService.mapParamFieldsToNew(prediction)
    )

    return {
      valid: data.id === this.counters.emailCheck,
      meta: {
        status,
        validationCounter: this.counters.emailCheck,
        type: 'email',
        predictions,
        hash: this.cryptoService.createHash(email),
        originalInput: email
      }
    }
  }

  async checkPerson (person, session) {
    this.counters.personCheck++
    const params = this.mappingService.mapParamFieldsToOld(person)
    const message = {
      jsonrpc: '2.0',
      id: this.counters.personCheck,
      method: 'nameCheck',
      params: {
        ...params
      }
    }

    const data = await this.#sendRequest(message, session)
    let { status, predictions } = data.result
    predictions = predictions.map(prediction =>
      this.mappingService.mapParamFieldsToNew(prediction)
    )

    return {
      valid: data.id === this.counters.personCheck,
      meta: {
        status,
        validationCounter: this.counters.personCheck,
        type: 'person',
        predictions,
        hash: this.cryptoService.createHash(person),
        originalInput: person
      }
    }
  }

  async splitStreet (address) {
    const message = {
      jsonrpc: '2.0',
      id: 1,
      method: 'splitStreet',
      params: {
        language: 'de',
        formatCountry: address.countryCode,
        street: address.streetFull
      }
    }

    const data = await this.#sendRequest(message, { id: 'not_required' })
    const { streetName, buildingNumber } = this.mappingService.mapParamFieldsToNew(data.result)
    return { streetName, buildingNumber }
  }

  enrichWithStreetFull (originalInput, prediction) {
    const { streetName, buildingNumber } = prediction

    if (this.isBuildingNumberBeforeStreetName(originalInput, streetName, buildingNumber)) {
      prediction.streetFull = `${buildingNumber} ${streetName}`
    } else {
      prediction.streetFull = `${streetName} ${buildingNumber}`
    }

    return prediction
  }

  isBuildingNumberBeforeStreetName (originalInput, streetName, buildingNumber) {
    const normalizedInput = originalInput.toLowerCase()
    const normalizedStreetName = streetName.toLowerCase()
    const normalizedBuildingNumber = buildingNumber.toLowerCase()

    const buildingNumberIndex = normalizedInput.indexOf(normalizedBuildingNumber)
    const streetNameIndex = normalizedInput.indexOf(normalizedStreetName)

    return buildingNumberIndex < streetNameIndex
  }

  handleError (error) {
    console.warn('ApiService encountered an error', error)
  }
}

export default ApiService

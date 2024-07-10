import TextService from './TextService'
import CryptoService from './CryptoService'
import AdditionalInfoNeedsCorrection from './statuses/address/AdditionalInfoNeedsCorrection'
import AddressMultipleVariants from './statuses/address/AddressMultipleVariants'
import AddressNeedsCorrection from './statuses/address/AddressNeedsCorrection'
import AddressNotFound from './statuses/address/AddressNotFound'
import BuildingNumberIsMissing from './statuses/address/BuildingNumberIsMissing'
import BuildingNumberNeedsCorrection from './statuses/address/BuildingNumberNeedsCorrection'
import BuildingNumberNotFound from './statuses/address/BuildingNumberNotFound'
import CountryCodeNeedsCorrection from './statuses/address/CountryCodeNeedsCorrection'
import LocalityNeedsCorrection from './statuses/address/LocalityNeedsCorrection'
import PostalCodeNeedsCorrection from './statuses/address/PostalCodeNeedsCorrection'
import StatusInterface from './statuses/StatusInterface'
import StreetFullNeedsCorrection from './statuses/address/StreetFullNeedsCorrection'
import StreetNameNeedsCorrection from './statuses/address/StreetNameNeedsCorrection'
import PostalCodeCorrect from './statuses/address/PostalCodeCorrect'
import AddressCorrect from './statuses/address/AddressCorrect'
import BuildingNumberCorrect from './statuses/address/BuildingNumberCorrect'
import CountryCodeCorrect from './statuses/address/CountryCodeCorrect'
import LocalityCorrect from './statuses/address/LocalityCorrect'
import StreetFullCorrect from './statuses/address/StreetFullCorrect'
import StreetNameCorrect from './statuses/address/StreetNameCorrect'
import AdditionalInfoCorrect from './statuses/address/AdditionalInfoCorrect'
import NameCorrect from './statuses/person/NameCorrect'
import NameNeedsCorrection from './statuses/person/NameNeedsCorrection'
import NameNotFound from './statuses/person/NameNotFound'
import EmailCorrect from './statuses/email/EmailCorrect'
import EmailNotCorrect from './statuses/email/EmailNotCorrect'
import PhoneCorrect from './statuses/phone/PhoneCorrect'
import PhoneNeedsCorrection from './statuses/phone/PhoneNeedsCorrection'
import PhoneInvalid from './statuses/phone/PhoneInvalid'
import ConfigService from './ConfigService'
import FilterService from './FilterService'
import EmailNoMx from './statuses/email/EmailNoMx'
import EmailMailboxDoesNotExist from './statuses/email/EmailMailboxDoesNotExist'
import PhoneHlrLookupFailed from './statuses/phone/PhoneHlrLookupFailed'
import PhoneFormatNeedsCorrection from './statuses/phone/PhoneFormatNeedsCorrection'
import PhoneExpectedTypeFixedLine from './statuses/phone/PhoneExpectedTypeFixedLine'
import PhoneExpectedTypeMobile from './statuses/phone/PhoneExpectedTypeMobile'
import SubdivisionCodeCorrect from './statuses/address/SubdivisionCodeCorrect'
import SubdivisionCodeNeedsCorrection from './statuses/address/SubdivisionCodeNeedsCorrection'

/**
 * Class representing the status service.
 */
class StatusService {
  /**
   * Creates an instance of StatusService.
   * @param configService
   * @param filterService
   * @param {TextService} textService - An instance of TextService.
   * @param {CryptoService} cryptoService - An instance of CryptoService.
   * @throws {TypeError} If textService is not an instance of TextService or cryptoService is not an instance of CryptoService.
   */
  constructor (configService, filterService, textService, cryptoService) {
    if (!(configService instanceof ConfigService)) {
      throw new TypeError('Invalid configService: Must be an instance of ConfigService')
    }
    if (!(filterService instanceof FilterService)) {
      throw new TypeError('Invalid filterService: Must be an instance of FilterService')
    }
    if (!(textService instanceof TextService)) {
      throw new TypeError('Invalid textService: Must be an instance of TextService')
    }

    if (!(cryptoService instanceof CryptoService)) {
      throw new TypeError('Invalid cryptoService: Must be an instance of CryptoService')
    }
    this.configService = configService
    this.filterService = filterService
    this.textService = textService
    this.cryptoService = cryptoService

    /**
     * @type {Array<StatusInterface>}
     */
    this.statuses = [
      new AddressCorrect(textService),
      new AddressMultipleVariants(textService),
      new AddressNeedsCorrection(textService),
      new AddressNotFound(textService),
      new CountryCodeCorrect(textService),
      new CountryCodeNeedsCorrection(textService),
      new SubdivisionCodeCorrect(textService),
      new SubdivisionCodeNeedsCorrection(textService),
      new LocalityCorrect(textService),
      new LocalityNeedsCorrection(textService),
      new PostalCodeCorrect(textService),
      new PostalCodeNeedsCorrection(textService),
      new StreetFullCorrect(textService),
      new StreetFullNeedsCorrection(textService),
      new StreetNameCorrect(textService),
      new StreetNameNeedsCorrection(textService),
      new BuildingNumberCorrect(textService),
      new BuildingNumberIsMissing(textService),
      new BuildingNumberNeedsCorrection(textService),
      new BuildingNumberNotFound(textService),
      new AdditionalInfoCorrect(textService),
      new AdditionalInfoNeedsCorrection(textService),
      new NameCorrect(textService),
      new NameNeedsCorrection(textService),
      new NameNotFound(textService),
      new EmailCorrect(textService),
      new EmailNotCorrect(textService),
      new EmailNoMx(textService),
      new EmailMailboxDoesNotExist(textService),
      new PhoneCorrect(textService),
      new PhoneNeedsCorrection(textService),
      new PhoneInvalid(textService),
      new PhoneHlrLookupFailed(textService),
      new PhoneFormatNeedsCorrection(textService),
      new PhoneExpectedTypeFixedLine(textService),
      new PhoneExpectedTypeMobile(textService)
    ]
  }

  /**
   * Retrieves root error messages based on status codes and namespace.
   * @param {Array<number|string>} statusCodes - An array of status codes.
   * @param {string} namespace - The namespace to check against.
   * @param {string|null} [fieldName=null] - The field name to filter relevant statuses (optional).
   * @returns {{hasRootErrors: boolean, rootErrors: Array<string>}} An object containing a boolean indicating if there are root errors and an array of root error messages.
   */
  getRootErrorMessages (statusCodes, namespace, fieldName = null) {
    const rootStatuses = this.getRootStatuses(statusCodes, namespace, fieldName)
    const errorStatuses = rootStatuses.filter(status => status.isError())
    const errorMessages = errorStatuses.map(status => status.getMessage(namespace))

    return {
      hasRootErrors: errorMessages.length > 0,
      rootErrors: errorMessages
    }
  }

  /**
   * Collects root statuses based on specified status codes, namespace, and optional field name.
   * @param {Array<number|string>} statusCodes - An array of status codes to check against.
   * @param {string} namespace - The namespace to check within.
   * @param {string|null} [fieldName=null] - The field name to filter relevant statuses (optional).
   * @returns {Array<StatusInterface>} - An array of root statuses.
   */
  getRootStatuses (statusCodes, namespace, fieldName = null) {
    const statusList = []
    const allStatuses = new Set()

    this.statuses.forEach(status => {
      if (fieldName && !status.relevantFields.includes(fieldName)) {
        return
      }
      if (status.isConditionMet(statusCodes, namespace)) {
        statusList.push(status)
        allStatuses.add(status.constructor.name)
      }
    })

    const rootStatusList = []

    statusList.forEach(status => {
      const parents = status.getParents()
      if (!parents || parents.every(parent => !allStatuses.has(parent.constructor.name))) {
        rootStatusList.push(status)
      }
    })

    return rootStatusList
  }

  /**
   * Retrieves leaf error messages based on status codes and namespace.
   * @param {Array<number|string>} statusCodes - An array of status codes.
   * @param {string} namespace - The namespace to check against.
   * @param {string|null} [fieldName=null] - The field name to filter relevant statuses (optional).
   * @returns {{hasLeafErrors: boolean, leafErrors: Array<string>}} An object containing a boolean indicating if there are leaf errors and an array of leaf error messages.
   */
  getLeafErrorMessages (statusCodes, namespace, fieldName = null) {
    const leafStatuses = this.getLeafStatuses(statusCodes, namespace, fieldName)
    const errorStatuses = leafStatuses.filter(status => status.isError())
    const errorMessages = errorStatuses.map(status => status.getMessage(namespace))

    return {
      hasLeafErrors: errorMessages.length > 0,
      leafErrors: errorMessages
    }
  }

  /**
   * Collects leaf statuses based on specified status codes, namespace, and optional field name.
   * @param {Array<number|string>} statusCodes - An array of status codes to check against.
   * @param {string} namespace - The namespace to check within.
   * @param {string|null} [fieldName=null] - The field name to filter relevant statuses (optional).
   * @returns {Array<StatusInterface>} - An array of leaf statuses.
   */
  getLeafStatuses (statusCodes, namespace, fieldName = null) {
    const rootStatuses = this.getRootStatuses(statusCodes, namespace, fieldName)
    const statuses = this.getStatuses(statusCodes, namespace, fieldName)
    const filteredStatuses = statuses.filter(status => !rootStatuses.includes(status))

    return filteredStatuses
  }

  /**
   * Collects all statuses based on specified status codes, namespace, and optional field name.
   * @param {Array<number|string>} statusCodes - An array of status codes to check against.
   * @param {string} namespace - The namespace to check within.
   * @param {string|null} [fieldName=null] - The field name to filter relevant statuses (optional).
   * @returns {Array<StatusInterface>} - An array of statuses.
   */
  getStatuses (statusCodes, namespace, fieldName = null) {
    const statusList = []
    const parentStatuses = new Set()

    this.statuses.forEach(status => {
      if (fieldName && !status.relevantFields.includes(fieldName)) {
        return
      }

      if (status.isConditionMet(statusCodes, namespace)) {
        statusList.push(status)

        const parents = status.getParents()
        if (parents) {
          parents.forEach(parent => parentStatuses.add(parent.constructor.name))
        }
      }
    })

    const filteredStatusList = statusList.filter(status => !parentStatuses.has(status.constructor.name))

    return filteredStatusList
  }

  getErrorMessages (statusCodes, namespace, fieldName = null) {
    const statuses = this.getStatuses(statusCodes, namespace, fieldName)
    const errorStatuses = statuses.filter(status => status.isError())
    const errorMessages = errorStatuses.map(status => status.getMessage(namespace))

    return {
      hasErrors: errorMessages.length > 0,
      errors: errorMessages
    }
  }

  getFieldErrorMessages (fieldName, data, meta) {
    if (!this.cryptoService.compareHash(meta.hash, data)) {
      return []
    }
    return this.getErrorMessages(meta.status, meta.type, fieldName)
  }

  /**
   * Checks if any status in the provided list is an error.
   * @param {Array<StatusInterface>} listOfStatuses - An array of statuses to check.
   * @returns {boolean} True if any status is an error, false otherwise.
   */
  hasAnyError (listOfStatuses) {
    return listOfStatuses.length > 0 && listOfStatuses.some(status => status.isError())
  }

  /**
   * Checks if all statuses in the provided list are successful.
   * @param {Array<StatusInterface>} listOfStatuses - An array of statuses to check.
   * @returns {boolean} True if all statuses are successful, false otherwise.
   */
  hasAllSuccess (listOfStatuses) {
    return listOfStatuses.length > 0 && listOfStatuses.every(status => status.isSuccess())
  }

  /**
   * Creates a list of fake success status codes based on the provided data object.
   * @param {object} data - The data object (e.g., an address).
   * @param {string} namespace - The namespace to check against.
   * @returns {Array<string>} An array of status codes that represent success statuses for the given data object.
   */
  createFakeSuccessStatusList (data, namespace) {
    const successStatusList = []

    this.statuses.forEach(status => {
      if (status.isSuccess() && status.relevantFields.some(field => Object.hasOwn(data, field))) {
        successStatusList.push(status.statusCode)
      }
    })

    return successStatusList
  }
}

export default StatusService

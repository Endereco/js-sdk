import BaseError from '../BaseError'

/**
 * Class representing a status indicating that the address needs correction.
 * @augments BaseError
 */
class AddressNeedsCorrection extends BaseError {
  /**
   * The status code for an address that needs correction.
   * @type {string}
   */
  statusCode = 'address_needs_correction'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = [
    'countryCode',
    'subdivisionCode',
    'postalCode',
    'locality',
    'streetFull',
    'streetName',
    'buildingNumber',
    'additionalInfo'
  ]

  /**
   * The parent statuses of the current status.
   * @type {Array<BaseError>}
   */
  parents = []
}

export default AddressNeedsCorrection

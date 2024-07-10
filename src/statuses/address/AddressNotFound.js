import BaseError from '../BaseError'

/**
 * Class representing a status indicating that the address was not found.
 * @augments BaseError
 */
class AddressNotFound extends BaseError {
  /**
   * The status code for an address that was not found.
   * @type {string}
   */
  statusCode = 'address_not_found'

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

export default AddressNotFound

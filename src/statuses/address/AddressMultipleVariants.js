import BaseError from '../BaseError'

/**
 * Class representing a status indicating that there are multiple address variants.
 * @augments BaseError
 */
class AddressMultipleVariants extends BaseError {
  /**
   * The status code for multiple address variants.
   * @type {string}
   */
  statusCode = 'address_multiple_variants'

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
}

export default AddressMultipleVariants

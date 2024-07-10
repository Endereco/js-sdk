import BaseSuccess from '../BaseSuccess'

/**
 * Class representing a status indicating that the address is correct.
 * @augments BaseSuccess
 */
class AddressCorrect extends BaseSuccess {
  /**
   * The status code for an address that is correct.
   * @type {string}
   */
  statusCode = 'address_correct'

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
   * @type {Array}
   */
  parents = []
}

export default AddressCorrect

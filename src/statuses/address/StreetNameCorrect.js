import BaseSuccess from '../BaseSuccess'
import StatusInterface from '../StatusInterface'
import AddressCorrect from './AddressCorrect'
import AddressNeedsCorrection from './AddressNeedsCorrection'
import AddressNotFound from './AddressNotFound'

/**
 * Class representing a status indicating that the street name is correct.
 * @augments BaseSuccess
 */
class StreetNameCorrect extends BaseSuccess {
  /**
   * The status code for the street name correct status.
   * @type {string}
   */
  statusCode = 'street_name_correct'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['streetFull', 'streetName']

  /**
   * The parent statuses of the current status.
   * @type {Array<StatusInterface>}
   */
  parents

  /**
   * Constructor for StreetNameCorrect class.
   * @param {object} textService - The text service to use for retrieving messages.
   */
  constructor (textService) {
    super(textService)
    this.parents = [
      new AddressCorrect(textService),
      new AddressNeedsCorrection(textService),
      new AddressNotFound(textService)
    ]
  }
}

export default StreetNameCorrect

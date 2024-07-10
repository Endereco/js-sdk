import BaseSuccess from '../BaseSuccess'
import StatusInterface from '../StatusInterface'
import AddressCorrect from './AddressCorrect'
import AddressNeedsCorrection from './AddressNeedsCorrection'
import AddressNotFound from './AddressNotFound'

/**
 * Class representing a status indicating that the street full information is correct.
 * @augments BaseSuccess
 */
class StreetFullCorrect extends BaseSuccess {
  /**
   * The status code for the street full correct status.
   * @type {string}
   */
  statusCode = 'street_full_correct'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['streetFull', 'streetName', 'buildingNumber']

  /**
   * The parent statuses of the current status.
   * @type {Array<StatusInterface>}
   */
  parents

  /**
   * Constructor for StreetFullCorrect class.
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

export default StreetFullCorrect

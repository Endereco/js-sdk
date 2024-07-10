import BaseSuccess from '../BaseSuccess'
import StatusInterface from '../StatusInterface'
import AddressCorrect from './AddressCorrect'
import AddressNeedsCorrection from './AddressNeedsCorrection'
import AddressNotFound from './AddressNotFound'

/**
 * Class representing a status indicating that the country code is correct.
 * @augments BaseSuccess
 */
class SubdivisionCodeCorrect extends BaseSuccess {
  /**
   * The status code for the country code correct status.
   * @type {string}
   */
  statusCode = 'subdivision_code_correct'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['subdivisionCode']

  /**
   * The parent statuses of the current status.
   * @type {Array<StatusInterface>}
   */
  parents

  /**
   * Constructor for CountryCodeCorrect class.
   * @param {object} textService - The text service to use for retrieving messages.
   */
  constructor (textService) {
    super(textService)
    this.parents = [
      new AddressNeedsCorrection(textService),
      new AddressNotFound(textService),
      new AddressCorrect(textService)
    ]
  }
}

export default SubdivisionCodeCorrect

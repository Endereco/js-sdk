import BaseSuccess from '../BaseSuccess'
import StatusInterface from '../StatusInterface'
import AddressCorrect from './AddressCorrect'
import AddressNeedsCorrection from './AddressNeedsCorrection'
import AddressNotFound from './AddressNotFound'

/**
 * Class representing a status indicating that the postal code is correct.
 * @augments BaseSuccess
 */
class PostalCodeCorrect extends BaseSuccess {
  /**
   * The status code for the postal code correct status.
   * @type {string}
   */
  statusCode = 'postal_code_correct'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['postalCode']

  /**
   * The parent statuses of the current status.
   * @type {Array<StatusInterface>}
   */
  parents

  /**
   * Constructor for PostalCodeCorrect class.
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

export default PostalCodeCorrect

import BaseSuccess from '../BaseSuccess'
import StatusInterface from '../StatusInterface'
import AddressCorrect from './AddressCorrect'
import AddressNeedsCorrection from './AddressNeedsCorrection'
import AddressNotFound from './AddressNotFound'

/**
 * Class representing a status indicating that the locality is correct.
 * @augments BaseSuccess
 */
class LocalityCorrect extends BaseSuccess {
  /**
   * The status code for the locality correct status.
   * @type {string}
   */
  statusCode = 'locality_correct'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['locality']

  /**
   * The parent statuses of the current status.
   * @type {Array<StatusInterface>}
   */
  parents

  /**
   * Constructor for LocalityCorrect class.
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

export default LocalityCorrect

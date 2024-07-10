import BaseSuccess from '../BaseSuccess'
import StatusInterface from '../StatusInterface'
import AddressCorrect from './AddressCorrect'
import AddressNeedsCorrection from './AddressNeedsCorrection'
import AddressNotFound from './AddressNotFound'

/**
 * Class representing a status indicating that additional information is correct.
 * @augments BaseSuccess
 */
class AdditionalInfoCorrect extends BaseSuccess {
  /**
   * The status code of the additional information correct status.
   * @type {string}
   */
  statusCode = 'additional_info_correct'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['additionalInfo']

  /**
   * The parent statuses of the current status.
   * @type {Array<StatusInterface>}
   */
  parents

  /**
   * Constructor for AdditionalInfoCorrect class.
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

export default AdditionalInfoCorrect

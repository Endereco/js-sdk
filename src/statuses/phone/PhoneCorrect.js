import BaseSuccess from '../BaseSuccess'
import StatusInterface from '../StatusInterface'

/**
 * Class representing a status indicating that the phone number is correct.
 * @augments BaseSuccess
 */
class PhoneCorrect extends BaseSuccess {
  /**
   * The status code of the phone correct status used for filtering.
   * @type {string}
   */
  statusCode = 'phone_correct'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['phone']

  /**
   * The parent statuses of the current status.
   * @type {Array<StatusInterface>}
   */
  parents

  /**
   * Constructor for PhoneCorrect class.
   * @param {object} textService - The text service to use for retrieving messages.
   */
  constructor (textService) {
    super(textService)
    this.parents = []
  }
}

export default PhoneCorrect

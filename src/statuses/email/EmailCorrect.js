import BaseSuccess from '../BaseSuccess'
import StatusInterface from '../StatusInterface'

/**
 * Class representing a status indicating that the email is correct.
 * @augments BaseSuccess
 */
class EmailCorrect extends BaseSuccess {
  /**
   * The status code of the email correct status used for filtering.
   * @type {string}
   */
  statusCode = 'email_correct'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['email']

  /**
   * The parent statuses of the current status.
   * @type {Array<StatusInterface>}
   */
  parents

  /**
   * Constructor for EmailCorrect class.
   * @param {object} textService - The text service to use for retrieving messages.
   */
  constructor (textService) {
    super(textService)
    this.parents = []
  }
}

export default EmailCorrect

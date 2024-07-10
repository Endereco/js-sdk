import BaseSuccess from '../BaseSuccess'
import StatusInterface from '../StatusInterface'

/**
 * Class representing a status indicating that persons name is correct.
 * @augments BaseSuccess
 */
class NameCorrect extends BaseSuccess {
  /**
   * The status code of the additional information correct status.
   * @type {string}
   */
  statusCode = 'name_correct'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['salutation', 'title', 'firstName', 'lastName']

  /**
   * The parent statuses of the current status.
   * @type {Array<StatusInterface>}
   */
  parents

  /**
   * Constructor for NameCorrect class.
   * @param {object} textService - The text service to use for retrieving messages.
   */
  constructor (textService) {
    super(textService)
    this.parents = [

    ]
  }
}

export default NameCorrect

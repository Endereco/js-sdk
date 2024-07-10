import BaseError from '../BaseError'

/**
 * Class representing a status indicating that the email is not correct.
 * @augments BaseError
 */
class EmailNotCorrect extends BaseError {
  /**
   * The status code for an email that is not correct.
   * @type {string}
   */
  statusCode = 'email_not_correct'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['email']

  /**
   * The parent statuses of the current status.
   * @type {Array<BaseError>}
   */
  parents = []
}

export default EmailNotCorrect

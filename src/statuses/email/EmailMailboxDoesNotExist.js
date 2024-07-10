import BaseError from '../BaseError'
import EmailNotCorrect from './EmailNotCorrect'

/**
 * Class representing a status indicating that the email is not correct.
 * @augments BaseError
 */
class EmailMailboxDoesNotExist extends BaseError {
  /**
   * The status code for an email that is not correct.
   * @type {string}
   */
  statusCode = 'email_mailbox_does_not_exist'

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

  /**
   * Constructor for EmailNotCorrect class.
   * @param {object} textService - The text service to use for retrieving messages.
   */
  constructor (textService) {
    super(textService)
    this.parents = [
      new EmailNotCorrect(textService)
    ]
  }
}

export default EmailMailboxDoesNotExist

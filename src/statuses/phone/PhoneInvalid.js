import BaseError from '../BaseError'

/**
 * Class representing a status indicating that the phone number is invalid.
 * @augments BaseError
 */
class PhoneInvalid extends BaseError {
  /**
   * The status code for a phone number that is invalid.
   * @type {string}
   */
  statusCode = 'phone_invalid'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['phone']

  /**
   * The parent statuses of the current status.
   * @type {Array<BaseError>}
   */
  parents = []
}

export default PhoneInvalid

import BaseError from '../BaseError'
import PhoneInvalid from './PhoneInvalid'

/**
 * Class representing a status indicating that the phone number is invalid.
 * @augments BaseError
 */
class PhoneExpectedTypeFixedLine extends BaseError {
  /**
   * The status code for a phone number that is invalid.
   * @type {string}
   */
  statusCode = 'phone_expected_type_fixed_line'

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

  constructor (textService) {
    super(textService)
    this.parents = [
      new PhoneInvalid(textService)
    ]
  }
}

export default PhoneExpectedTypeFixedLine

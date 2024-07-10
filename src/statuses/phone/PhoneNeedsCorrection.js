import BaseError from '../BaseError'

/**
 * Class representing a status indicating that the phone number needs correction.
 * @augments BaseError
 */
class PhoneNeedsCorrection extends BaseError {
  /**
   * The status code for a phone number that needs correction.
   * @type {string}
   */
  statusCode = 'phone_needs_correction'

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

export default PhoneNeedsCorrection

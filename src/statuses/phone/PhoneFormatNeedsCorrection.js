import BaseError from '../BaseError'
import PhoneInvalid from './PhoneInvalid'
import PhoneNeedsCorrection from './PhoneNeedsCorrection'

/**
 * Class representing a status indicating that the phone number is invalid.
 * @augments BaseError
 */
class PhoneFormatNeedsCorrection extends BaseError {
  /**
   * The status code for a phone number that is invalid.
   * @type {string}
   */
  statusCode = 'phone_format_needs_correction'

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
      new PhoneInvalid(textService),
      new PhoneNeedsCorrection(textService)
    ]
  }
}

export default PhoneFormatNeedsCorrection

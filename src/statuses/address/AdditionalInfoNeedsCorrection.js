import AddressNeedsCorrection from './AddressNeedsCorrection'
import BaseError from '../BaseError'

/**
 * Class representing a status indicating that additional information needs correction.
 * @augments BaseError
 */
class AdditionalInfoNeedsCorrection extends BaseError {
  /**
   * The status code for additional information needs correction.
   * @type {string}
   */
  statusCode = 'additional_info_needs_correction'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['additionalInfo']

  /**
   * The parent statuses of the current status.
   * @type {Array<BaseError>}
   */
  parents

  /**
   * Constructor for AdditionalInfoNeedsCorrection class.
   * @param {object} textService - The text service to use for retrieving messages.
   */
  constructor (textService) {
    super(textService)
    this.parents = [
      new AddressNeedsCorrection(textService)
    ]
  }
}

export default AdditionalInfoNeedsCorrection

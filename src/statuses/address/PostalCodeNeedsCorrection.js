import BaseError from '../BaseError'
import AddressNeedsCorrection from './AddressNeedsCorrection'

/**
 * Class representing a status indicating that the postal code needs correction.
 * @augments BaseError
 */
class PostalCodeNeedsCorrection extends BaseError {
  /**
   * The status code for the postal code needs correction status.
   * @type {string}
   */
  statusCode = 'postal_code_needs_correction'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['postalCode']

  /**
   * The parent statuses of the current status.
   * @type {Array<BaseError>}
   */
  parents

  /**
   * Constructor for PostalCodeNeedsCorrection class.
   * @param {object} textService - The text service to use for retrieving messages.
   */
  constructor (textService) {
    super(textService)
    this.parents = [
      new AddressNeedsCorrection(textService)
    ]
  }
}

export default PostalCodeNeedsCorrection

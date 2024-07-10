import BaseError from '../BaseError'
import AddressNeedsCorrection from './AddressNeedsCorrection'
import AddressNotFound from './AddressNotFound'

/**
 * Class representing a status indicating that the country code needs correction.
 * @augments BaseError
 */
class SubdivisionCodeNeedsCorrection extends BaseError {
  /**
   * The status code for the country code needs correction status.
   * @type {string}
   */
  statusCode = 'subdivision_code_needs_correction'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['subdivisionCode']

  /**
   * The parent statuses of the current status.
   * @type {Array<BaseError>}
   */
  parents

  /**
   * Constructor for CountryCodeNeedsCorrection class.
   * @param {object} textService - The text service to use for retrieving messages.
   */
  constructor (textService) {
    super(textService)
    this.parents = [
      new AddressNeedsCorrection(textService),
      new AddressNotFound(textService)
    ]
  }
}

export default SubdivisionCodeNeedsCorrection

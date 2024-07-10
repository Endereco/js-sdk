import BaseError from '../BaseError'
import AddressNeedsCorrection from './AddressNeedsCorrection'

/**
 * Class representing a status indicating that the street name needs correction.
 * @augments BaseError
 */
class StreetNameNeedsCorrection extends BaseError {
  /**
   * The status code for the street name needs correction status.
   * @type {string}
   */
  statusCode = 'street_name_needs_correction'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['streetFull', 'streetName']

  /**
   * The parent statuses of the current status.
   * @type {Array<BaseError>}
   */
  parents

  /**
   * Constructor for StreetNameNeedsCorrection class.
   * @param {object} textService - The text service to use for retrieving messages.
   */
  constructor (textService) {
    super(textService)
    this.parents = [
      new AddressNeedsCorrection(textService)
    ]
  }
}

export default StreetNameNeedsCorrection

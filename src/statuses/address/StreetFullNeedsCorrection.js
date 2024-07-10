import BaseError from '../BaseError'
import AddressNeedsCorrection from './AddressNeedsCorrection'

/**
 * Class representing a status indicating that the street full information needs correction.
 * @augments BaseError
 */
class StreetFullNeedsCorrection extends BaseError {
  /**
   * The status code for the street full needs correction status.
   * @type {string}
   */
  statusCode = 'street_full_needs_correction'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['streetFull', 'streetName', 'buildingNumber']

  /**
   * The parent statuses of the current status.
   * @type {Array<BaseError>}
   */
  parents

  /**
   * Constructor for StreetFullNeedsCorrection class.
   * @param {object} textService - The text service to use for retrieving messages.
   */
  constructor (textService) {
    super(textService)
    this.parents = [
      new AddressNeedsCorrection(textService)
    ]
  }
}

export default StreetFullNeedsCorrection

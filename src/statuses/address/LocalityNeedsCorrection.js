import BaseError from '../BaseError'
import AddressNeedsCorrection from './AddressNeedsCorrection'

/**
 * Class representing a status indicating that the locality needs correction.
 * @augments BaseError
 */
class LocalityNeedsCorrection extends BaseError {
  /**
   * The status code for the locality needs correction status.
   * @type {string}
   */
  statusCode = 'locality_needs_correction'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['locality']

  /**
   * The parent statuses of the current status.
   * @type {Array<BaseError>}
   */
  parents

  /**
   * Constructor for LocalityNeedsCorrection class.
   * @param {object} textService - The text service to use for retrieving messages.
   */
  constructor (textService) {
    super(textService)
    this.parents = [
      new AddressNeedsCorrection(textService)
    ]
  }
}

export default LocalityNeedsCorrection

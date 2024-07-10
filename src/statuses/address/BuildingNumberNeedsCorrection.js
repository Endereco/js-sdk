import BaseError from '../BaseError'
import StatusInterface from '../StatusInterface'
import AddressNeedsCorrection from './AddressNeedsCorrection'
import AddressNotFound from './AddressNotFound'

/**
 * Class representing a status indicating that the building number needs correction.
 * @augments BaseError
 */
class BuildingNumberNeedsCorrection extends BaseError {
  /**
   * The status code for the building number needs correction status.
   * @type {string}
   */
  statusCode = 'building_number_needs_correction'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['buildingNumber']

  /**
   * The parent statuses of the current status.
   * @type {Array<StatusInterface>}
   */
  parents

  /**
   * Constructor for BuildingNumberNeedsCorrection class.
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

export default BuildingNumberNeedsCorrection

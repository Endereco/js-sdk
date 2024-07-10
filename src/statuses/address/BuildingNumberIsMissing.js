import AddressNeedsCorrection from './AddressNeedsCorrection'
import BaseError from '../BaseError'
import BuildingNumberNeedsCorrection from './BuildingNumberNeedsCorrection'
import AddressNotFound from './AddressNotFound'
import StatusInterface from '../StatusInterface'

/**
 * Class representing a status indicating that the building number is missing.
 * @augments BaseError
 */
class BuildingNumberIsMissing extends BaseError {
  /**
   * The status code for the building number is missing status.
   * @type {string}
   */
  statusCode = 'building_number_is_missing'

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
   * Constructor for BuildingNumberIsMissing class.
   * @param {object} textService - The text service to use for retrieving messages.
   */
  constructor (textService) {
    super(textService)
    this.parents = [
      new AddressNeedsCorrection(textService),
      new AddressNotFound(textService),
      new BuildingNumberNeedsCorrection(textService)
    ]
  }
}

export default BuildingNumberIsMissing

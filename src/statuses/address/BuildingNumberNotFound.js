import AddressNeedsCorrection from './AddressNeedsCorrection'
import BaseError from '../BaseError'
import BuildingNumberNeedsCorrection from './BuildingNumberNeedsCorrection'
import AddressNotFound from './AddressNotFound'

/**
 * Class representing a status indicating that the building number was not found.
 * @augments BaseError
 */
class BuildingNumberNotFound extends BaseError {
  /**
   * The status code for the building number not found status.
   * @type {string}
   */
  statusCode = 'building_number_not_found'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = ['buildingNumber']

  /**
   * The parent statuses of the current status.
   * @type {Array<BaseError>}
   */
  parents

  /**
   * Constructor for BuildingNumberNotFound class.
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

export default BuildingNumberNotFound

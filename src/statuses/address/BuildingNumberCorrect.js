import AddressCorrect from './AddressCorrect'
import StatusInterface from '../StatusInterface'
import BaseSuccess from '../BaseSuccess'
import AddressNeedsCorrection from './AddressNeedsCorrection'
import AddressNotFound from './AddressNotFound'

/**
 * Class representing a status indicating that the building number is correct.
 * @augments BaseSuccess
 */
class BuildingNumberCorrect extends BaseSuccess {
  /**
   * The status code for the building number correct status.
   * @type {string}
   */
  statusCode = 'building_number_correct'

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
   * Constructor for BuildingNumberCorrect class.
   * @param {object} textService - The text service to use for retrieving messages.
   */
  constructor (textService) {
    super(textService)
    this.parents = [
      new AddressCorrect(textService),
      new AddressNeedsCorrection(textService),
      new AddressNotFound(textService)
    ]
  }
}

export default BuildingNumberCorrect

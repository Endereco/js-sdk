import BaseError from '../BaseError'

/**
 * Class representing a status indicating that the address needs correction.
 * @augments BaseError
 */
class NameNeedsCorrection extends BaseError {
  /**
   * The status code for an address that needs correction.
   * @type {string}
   */
  statusCode = 'name_needs_correction'

  /**
   * The fields relevant to this status.
   * @type {Array<string>}
   */
  relevantFields = [
    'salutation',
    'title',
    'firstName',
    'lastName'
  ]

  /**
   * The parent statuses of the current status.
   * @type {Array<BaseError>}
   */
  parents = []
}

export default NameNeedsCorrection

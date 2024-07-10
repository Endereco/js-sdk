import BaseError from '../BaseError'

/**
 * Class representing a status indicating that the persons name was not found.
 * @augments BaseError
 */
class NameNotFound extends BaseError {
  /**
   * The status code for an address that was not found.
   * @type {string}
   */
  statusCode = 'name_not_found'

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

export default NameNotFound

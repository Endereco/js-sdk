import TextService from '../TextService'

/**
 * @typedef {import('../TextService')} TextService
 */

/**
 * Abstract class representing a status message interface.
 * @abstract
 */
class StatusInterface {
  /**
   * @type {Array}
   */
  parents = []

  /**
   * @type {Array}
   */
  relevantFields = []

  /**
   * Creates an instance of StatusInterface.
   * @param {TextService} textService - An instance of TextService.
   * @throws {TypeError} If attempting to instantiate directly or if textService is not an instance of TextService.
   */
  constructor (textService = ' ') {
    if (new.target === StatusInterface) {
      throw new TypeError('Cannot construct StatusInterface instances directly')
    }
    if (!(textService instanceof TextService)) {
      throw new TypeError('Invalid textService: Must be an instance of TextService')
    }
    /**
     * @type {TextService}
     */
    this.textService = textService
  }

  /**
   * Checks if a certain condition is met based on status codes and namespace.
   * @abstract
   * @param {Array<string>} statusCodes - An array of status codes.
   * @param {string} namespace - The namespace to check against.
   * @returns {boolean} True if the condition is met, otherwise false.
   * @throws {Error} If the method is not implemented.
   */
  isConditionMet (statusCodes, namespace) {
    throw new Error("Method 'isConditionMet()' must be implemented.")
  }

  /**
   * Determines if the status represents an error.
   * @abstract
   * @returns {boolean} True if the status is an error, otherwise false.
   * @throws {Error} If the method is not implemented.
   */
  isError () {
    throw new Error("Method 'isError()' must be implemented.")
  }

  /**
   * Determines if the status represents a warning.
   * @abstract
   * @returns {boolean} True if the status is a warning, otherwise false.
   * @throws {Error} If the method is not implemented.
   */
  isWarning () {
    throw new Error("Method 'isWarning()' must be implemented.")
  }

  /**
   * Determines if the status represents an informational message.
   * @abstract
   * @returns {boolean} True if the status is informational, otherwise false.
   * @throws {Error} If the method is not implemented.
   */
  isInfo () {
    throw new Error("Method 'isInfo()' must be implemented.")
  }

  /**
   * Determines if the status represents a success.
   * @abstract
   * @returns {boolean} True if the status is a success, otherwise false.
   * @throws {Error} If the method is not implemented.
   */
  isSuccess () {
    throw new Error("Method 'isSuccess()' must be implemented.")
  }

  /**
   * Retrieves the message associated with the given namespace.
   * @abstract
   * @param {string} namespace - The namespace to retrieve the message for.
   * @returns {string} The message associated with the namespace.
   * @throws {Error} If the method is not implemented.
   */
  getMessage (namespace) {
    throw new Error("Method 'getMessage()' must be implemented.")
  }

  /**
   * Retrieves the parents of the current status message.
   * @returns {Array} The parents of the current status message.
   */
  getParents () {
    return this.parents
  }
}

export default StatusInterface

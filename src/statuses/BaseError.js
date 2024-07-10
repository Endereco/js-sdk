import StatusInterface from './StatusInterface'

/**
 * Class representing a base status error message.
 * @augments StatusInterface
 */
class BaseError extends StatusInterface {
  /**
   * The status code corresponding to this object.
   * @type {number}
   */
  statusCode

  /**
   * Checks if a certain condition is met based on status codes and namespace.
   * @param {Array<number>} statusCodes - An array of status codes.
   * @param {string} namespace - The namespace to check against.
   * @returns {boolean} True if the condition is met, otherwise false.
   */
  isConditionMet (statusCodes, namespace) {
    const statusExists = statusCodes.includes(this.statusCode)
    const messageEmpty = !this.getMessage(namespace)
    return statusExists && !messageEmpty
  }

  /**
   * Determines if the status represents an error.
   * @returns {boolean} True if the status is an error, otherwise false.
   */
  isError () {
    return true
  }

  /**
   * Determines if the status represents a warning.
   * @returns {boolean} True if the status is a warning, otherwise false.
   */
  isWarning () {
    return false
  }

  /**
   * Determines if the status represents an informational message.
   * @returns {boolean} True if the status is informational, otherwise false.
   */
  isInfo () {
    return false
  }

  /**
   * Determines if the status represents a success.
   * @returns {boolean} True if the status is a success, otherwise false.
   */
  isSuccess () {
    return false
  }

  /**
   * Retrieves the message associated with the given namespace.
   * @param {string} namespace - The namespace to retrieve the message for.
   * @returns {string} The message associated with the namespace.
   */
  getMessage (namespace) {
    const statusCode = this.statusCode
    return this.textService.getErrorMessage(`${namespace}.${statusCode}`)
  }

  /**
   * Retrieves the parents of the current status message.
   * @returns {Array} The parents of the current status message.
   */
  getParents () {
    return this.parents
  }
}

export default BaseError

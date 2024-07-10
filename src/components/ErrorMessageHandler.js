import Mustache from 'mustache'

class ErrorMessageHandler {
  constructor (formManager) {
    this.formManager = formManager
    this.errorMessageContainerRegistry = new Map()
    this.usedErrorCodes = new Map()
  }

  displayErrorMessages (data, meta) {
    const formManagerName = this.formManager.name
    const errorMessageContainers = new Map()
    this.formManager.selectorHandler.getSelectorsWithFieldNames().forEach(item => {
      const { fieldName, selector } = item
      Array.from(document.querySelectorAll(selector)).forEach(element => {
        const errorContainer = this.findErrorMessageContainer(element, formManagerName)
        const errorMessages = this.getErrorMessagesOrNothing(data, meta, fieldName)

        if (!errorMessageContainers.has(errorContainer)) {
          errorMessageContainers.set(errorContainer, new Set())
        }

        const errorMessagesSet = errorMessageContainers.get(errorContainer)
        errorMessages.forEach(message => errorMessagesSet.add(message))
      })
    })

    errorMessageContainers.forEach((errorMessagesSet, errorContainer) => {
      this.cleanUpErrorContainer(errorContainer)
      const errorMessages = Array.from(errorMessagesSet)
      const uniqueID = this.formManager.cryptoService.generateUniqueID()
      const template = this.formManager.templateService.getErrorListTemplate()
      const renderedHtml = Mustache.render(template, {
        uniqueID,
        hasErrors: errorMessages.length > 0,
        errors: errorMessages
      })
      this.insertIntoDOM(errorContainer, renderedHtml, uniqueID)
    })
  }

  getErrorMessagesOrNothing (data, meta, fieldName) {
    if (!this.formManager.cryptoService.compareHash(meta.hash, data)) {
      return []
    }

    const { errors } = this.formManager.statusService.getErrorMessages(meta.status, meta.type, fieldName)

    return errors
  }

  /**
   * Removes an underfield error message.
   * @param {string} uniqueID - Unique identifier of the error message to remove.
   * @param errorContainerElement
   */
  cleanUpErrorContainer (errorContainerElement) {
    if (!this.errorMessageContainerRegistry.has(errorContainerElement)) {
      return
    }

    const errorListSet = this.errorMessageContainerRegistry.get(errorContainerElement)
    errorListSet.forEach(uniqueID => {
      const errorElement = document.getElementById(uniqueID)
      if (errorElement) {
        errorElement.parentNode.removeChild(errorElement)
      }
    })

    this.errorMessageContainerRegistry.set(errorContainerElement, new Set())
  }

  /**
   * Finds the appropriate container for an error message.
   * @param {HTMLElement} anchorElement - Element to anchor the error message to.
   * @param {string|null} formManagerName - Name of the form manager used to filter out the error container.
   * @returns {HTMLElement|null} The container element for the error message.
   */
  findErrorMessageContainer (anchorElement, formManagerName) {
    return this.findPossibleCustomErrorMessageContainer(formManagerName) ||
           anchorElement.closest('div') ||
           anchorElement.parentElement
  }

  /**
   * Finds a possible custom error message container.
   * @param {string|null} formManagerName - Name of the form manager used to filter out the error container.
   * @returns {HTMLElement|null} The custom error message container if found, null otherwise.
   */
  findPossibleCustomErrorMessageContainer (formManagerName) {
    const containerElements = document.querySelectorAll('[endereco-error-container]')
    if (containerElements.length === 0) return null
    return Array.from(containerElements).find(element => {
      const allowedManagerNames = element.getAttribute('endereco-error-container').split('|')
      return allowedManagerNames.includes(formManagerName) || allowedManagerNames.includes('*')
    }) || null
  }

  /**
   * Inserts HTML into the DOM.
   * @param {HTMLElement} containerElement - The element into which the HTML will be inserted.
   * @param {string} html - The HTML string to insert.
   * @param uniqueID
   */
  insertIntoDOM (containerElement, html, uniqueID) {
    containerElement.insertAdjacentHTML('beforeend', html)
    if (!this.errorMessageContainerRegistry.has(containerElement)) {
      this.errorMessageContainerRegistry.set(containerElement, new Set())
    }
    const errorListSet = this.errorMessageContainerRegistry.get(containerElement)
    errorListSet.add(uniqueID)
    this.errorMessageContainerRegistry.set(containerElement, errorListSet)
  }
}

export default ErrorMessageHandler

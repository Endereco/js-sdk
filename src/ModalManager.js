import Mustache from 'mustache'
import { diffWords } from 'diff'
import ConfigService from './ConfigService'
import FilterService from './FilterService'
import TemplateService from './TemplateService'
import TextService from './TextService'
import StatusService from './StatusService'

const CLASS_NAMES = {
  ADD: 'endereco-span--add',
  REMOVE: 'endereco-span--remove',
  NEUTRAL: 'endereco-span--neutral'
}

class ModalManager {
  constructor (configService, filterService, templateService, textService, statusService) {
    if (!(configService instanceof ConfigService)) {
      throw new TypeError('Invalid configService: Must be an instance of ConfigService')
    }
    if (!(filterService instanceof FilterService)) {
      throw new TypeError('Invalid filterService: Must be an instance of FilterService')
    }
    if (!(templateService instanceof TemplateService)) {
      throw new TypeError('Invalid templateService: Must be an instance of TemplateService')
    }
    if (!(textService instanceof TextService)) {
      throw new TypeError('Invalid textService: Must be an instance of TextService')
    }
    if (!(statusService instanceof StatusService)) {
      throw new TypeError('Invalid statusService: Must be an instance of StatusService')
    }
    this.configService = configService
    this.filterService = filterService
    this.templateService = templateService
    this.textService = textService
    this.statusService = statusService

    this.modalRegistry = new WeakMap()
    this.modalQueue = []
    this.isModalOpen = false
  }

  /**
   * Enqueues a modal request and processes the queue.
   * @param {Function} displayFunction - The function to call to display the modal.
   */
  enqueueModal (displayFunction) {
    this.modalQueue.push(displayFunction)
    this.processQueue()
  }

  /**
   * Processes the modal queue to ensure modals are displayed one by one.
   */
  async processQueue () {
    if (this.isModalOpen || this.modalQueue.length === 0) return

    if (this.checkExternalModalsOpen()) {
      // Wait for external modals to close
      await this.waitForExternalModalsToClose()
    }

    this.isModalOpen = true
    const displayFunction = this.modalQueue.shift()
    displayFunction()
  }

  /**
   * Displays the address selection modal.
   * @param {object} meta - The meta information for the modal.
   * @param {Function} onAddressSelect - The callback function for selecting an address.
   * @param {Function} onConfirmOriginalAddress - The callback function for confirming the original address.
   * @param {Function} onEditAddress - The callback function for editing the address.
   * @param {Function} onClose - The callback function for closing the modal.
   */
  displayAddressSelectionModal (meta, onAddressSelect, onConfirmOriginalAddress, onEditAddress, onClose) {
    this.enqueueModal(() => {
      const modalTemplate = this.templateService.getTemplate('addressSelectionModal')
      const uniqueID = this.generateUniqueID()

      const { originalAddressHtml, selectableAddressesHtmlArray } = this.prepareSelectioModalData(meta)

      const modalTexts = this.textService.getTexts('modals')
      const modalConfig = this.configService.getConfig('modals')
      const leafErrors = this.statusService.getLeafErrorMessages(meta.status, 'address')
      const rootErrors = this.statusService.getRootErrorMessages(meta.status, 'address')

      const renderedHtml = Mustache.render(modalTemplate, {
        uniqueID,
        originalInput: originalAddressHtml,
        predictions: selectableAddressesHtmlArray,
        ...rootErrors,
        ...leafErrors,
        ...modalTexts,
        ...modalConfig
      })

      const modal = this.insertIntoDOM(document.body, renderedHtml, uniqueID)
      this.addModalListeners(modal, meta, onAddressSelect, onConfirmOriginalAddress, onEditAddress, onClose)
    })
  }

  displayAddressReviewModal (meta, onConfirmOriginalAddress, onEditAddress, onClose) {
    this.enqueueModal(() => {
      const modalTemplate = this.templateService.getTemplate('addressReviewModal')
      const uniqueID = this.generateUniqueID()

      const originalAddressHtml = this.prepareOriginalAddressHtml(meta)
      const texts = this.textService.getTexts('modals')
      const config = this.configService.getConfig('modals')
      const leafErrors = this.statusService.getLeafErrorMessages(meta.status, 'address')
      const rootErrors = this.statusService.getRootErrorMessages(meta.status, 'address')

      const renderedHtml = Mustache.render(modalTemplate, {
        uniqueID,
        originalInput: originalAddressHtml,
        ...rootErrors,
        ...leafErrors,
        ...texts,
        ...config
      })

      const modal = this.insertIntoDOM(document.body, renderedHtml, uniqueID)
      this.addConfirmButtonListener(modal, onConfirmOriginalAddress)
      this.addEditButtonListeners(modal, onEditAddress)
      this.addCloseListener(modal, onClose)
    })
  }

  prepareSelectioModalData (meta) {
    const originalAddressHtml = (this.generateAddressLines(
      this.highlightPredictionDifference(meta.originalInput, meta.originalInput)
    )).join('')

    const selectableAddressesHtmlArray = meta.predictions.map((address, index) => ({
      index,
      attributes: index === 0 ? 'checked' : '',
      addressDiff: (this.generateAddressLines(
        this.highlightPredictionDifference(meta.originalInput, address)
      )).join('')
    }))

    return { originalAddressHtml, selectableAddressesHtmlArray }
  }

  prepareOriginalAddressHtml (meta) {
    const originalAddressHtml = (this.generateAddressLines(
      this.highlightPredictionDifference(meta.originalInput, meta.originalInput)
    )).join('')

    const wrappedAddress = this.templateService.createStatusWrapper(originalAddressHtml, meta.status)

    return wrappedAddress
  }

  highlightPredictionDifference (originalInput, prediction) {
    const predictionCopy = { ...prediction }
    Object.keys(originalInput).forEach(key => {
      if (Object.hasOwn(originalInput, key) && Object.hasOwn(predictionCopy, key)) {
        const inputToCompare = predictionCopy[key]
        const originalValue = originalInput[key]
        const diff = diffWords(originalValue, inputToCompare, { ignoreCase: false })
        const diffHtml = diff.map(part => {
          const markClass = part.added ? CLASS_NAMES.ADD : part.removed ? CLASS_NAMES.REMOVE : CLASS_NAMES.NEUTRAL
          const value = part.value.replace(/[ ]/g, '&nbsp;')
          return `<span class="${markClass}">${value}</span>`
        }).join('')

        predictionCopy[`${key}Diff`] = diffHtml
      }
    })
    return predictionCopy
  }

  generateAddressLines (address) {
    const addressLines = this.templateService.getAddressLineTemplates(address)
    const renderedAddressLines = []
    addressLines.forEach(addresslineTemplate => {
      renderedAddressLines.push(Mustache.render(addresslineTemplate, address))
    })

    return renderedAddressLines
  }

  insertIntoDOM (anchorElement, html, uniqueID) {
    anchorElement.insertAdjacentHTML('beforeend', html)
    return document.getElementById(uniqueID)
  }

  addModalListeners (modal, meta, onAddressSelect, onConfirmOriginalAddress, onEditAddress, onClose) {
    if (!modal) return

    this.addSelectButtonListener(modal, meta, onAddressSelect)
    this.addConfirmButtonListener(modal, onConfirmOriginalAddress)
    this.addEditButtonListeners(modal, onEditAddress)
    this.addAddressSelectionChangeListener(modal)
    this.addConfirmCheckboxListener(modal)
    this.addCloseListener(modal, onClose)
  }

  addSelectButtonListener (modal, meta, onAddressSelect) {
    if (!modal) return
    const selectButton = modal.querySelector('[endereco-use-selected-address]')
    if (selectButton) {
      selectButton.addEventListener('click', (e) => {
        e.preventDefault()
        const selectedPredictionIndex = parseInt(modal.querySelector('input[name="endereco-address-predictions"]:checked').value)
        const selectedPrediction = meta.predictions[selectedPredictionIndex]
        onAddressSelect(selectedPrediction)
        this.closeModal(modal)
      })
    }
  }

  addConfirmButtonListener (modal, onConfirmOriginalAddress) {
    if (!modal) return
    const confirmButton = modal.querySelector('[endereco-confirm-address]')
    if (confirmButton) {
      confirmButton.addEventListener('click', (e) => {
        e.preventDefault()
        onConfirmOriginalAddress()
        this.closeModal(modal)
      })
    }
  }

  addEditButtonListeners (modal, onEditAddress) {
    if (!modal) return
    const editButtons = modal.querySelectorAll('[endereco-edit-address]')
    if (editButtons.length > 0) {
      editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault()
          onEditAddress()
          this.closeModal(modal)
        })
      })
    }
  }

  addAddressSelectionChangeListener (modal) {
    if (!modal) return

    const checkboxes = modal.querySelectorAll('input[name="endereco-address-predictions"]')
    const activeCheckbox = modal.querySelector('input[name="endereco-address-predictions"]:checked')
    const confirmButton = modal.querySelector('[endereco-confirm-address]')
    const selectButton = modal.querySelector('[endereco-use-selected-address]')
    const showIfOriginElements = modal.querySelectorAll('[endereco-show-if-origin]')

    const toggleOptionalAreasState = (checkbox) => {
      const shouldShowOrigin = checkbox.checked && checkbox.value < 0

      showIfOriginElements.forEach(element => {
        element.style.display = shouldShowOrigin ? 'block' : 'none'
      })

      if (confirmButton) {
        confirmButton.style.display = shouldShowOrigin ? 'inline-block' : 'none'
      }

      if (selectButton) {
        selectButton.style.display = shouldShowOrigin ? 'none' : 'inline-block'
      }
    }

    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (event) => {
        toggleOptionalAreasState(event.target)
      })
    })

    if (activeCheckbox) {
      toggleOptionalAreasState(activeCheckbox)
    }
  }

  addConfirmCheckboxListener (modal) {
    if (!modal) return
    const confirmCheckbox = modal.querySelector('[endereco-confirm-address-checkbox]')
    const confirmButton = modal.querySelector('[endereco-confirm-address]')

    if (confirmCheckbox) {
      const toggleButtonsState = () => {
        const isChecked = confirmCheckbox.checked
        if (confirmButton) confirmButton.disabled = !isChecked
      }

      confirmCheckbox.addEventListener('change', toggleButtonsState)
      toggleButtonsState()
    }
  }

  /**
   * Adds event listeners for the modal buttons.
   * @param {string} uniqueID - The unique ID of the modal.
   * @param {Function} onAddressSelect - The callback function for selecting an address.
   * @param {Function} onConfirmOriginalAddress - The callback function for confirming the original address.
   * @param {Function} onEditAddress - The callback function for editing the address.
   * @param modal
   * @param {Function} onClose - The callback function for closing the modal.
   */
  addCloseListener (modal, onClose) {
    if (!modal) return

    modal.querySelector('[endereco-modal-close]').addEventListener('click', (e) => {
      e.preventDefault()
      onClose()
      this.closeModal(modal)
    })
  }

  /**
   * Generates a unique ID.
   * @returns {string} A unique ID string.
   */
  generateUniqueID () {
    return `${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`
  }

  /**
   * Closes the modal and removes it from the DOM.
   * @param {HTMLElement} modal - The modal element to close.
   */
  closeModal (modal) {
    if (modal) {
      modal.parentNode.removeChild(modal)
    }
    this.isModalOpen = false
    this.processQueue()
  }

  /**
   * Checks if any external modals are open.
   * @returns {boolean} True if any external modals are open, false otherwise.
   */
  checkExternalModalsOpen () {
    // Implement logic to check for external modals
    return false
  }

  /**
   * Waits for external modals to close.
   * @returns {Promise} A promise that resolves when external modals are closed.
   */
  waitForExternalModalsToClose () {
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations) => {
        if (!this.checkExternalModalsOpen()) {
          observer.disconnect()
          resolve()
        }
      })

      observer.observe(document.body, { childList: true, subtree: true })
    })
  }
}

export default ModalManager

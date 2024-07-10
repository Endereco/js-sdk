import ChangeHandler from './components/ChangeHandler'
import DropdownHandler from './components/DropdownHandler'
import ErrorMessageHandler from './components/ErrorMessageHandler'
import EventHandler from './components/EventHandler'
import FlagHandler from './components/FlagHandler'
import FocusHandler from './components/FocusHandler'
import LayoutHandler from './components/LayoutHandler'
import SelectorHandler from './components/SelectorHandler'
import StatusStyleHandler from './components/StatusStyleHandler'
import ValueHandler from './components/ValueHandler'
import ConfigService from './ConfigService'
import CryptoService from './CryptoService'
import DataCollection from './datastructures/DataCollection'
import FilterService from './FilterService'
import MappingService from './MappingService'
import StatusService from './StatusService'
import TemplateService from './TemplateService'

/**
 * @class FormManager
 * @description A comprehensive form management class that handles various aspects of form functionality,
 * including event handling, field selection, value management, focus control, layout changes,
 * status display, error messaging, and dropdown interactions. It integrates multiple services
 * and components to provide a cohesive form management solution.
 */
class FormManager {
  /**
   * @class
   * @param {ConfigService} configService - Service for managing configuration settings
   * @param {FilterService} filterService - Service for applying filters to form data
   * @param {CryptoService} cryptoService - Service for handling cryptographic operations
   * @param {MappingService} mappingService - Service for data mapping operations
   * @param {StatusService} statusService - Service for managing form status
   * @param {TemplateService} templateService - Service for handling templates
   * @throws {TypeError} If any of the provided services are not of the correct type
   */
  constructor (configService, filterService, cryptoService, mappingService, statusService, templateService) {
    if (!(configService instanceof ConfigService)) {
      throw new TypeError('Invalid configService: Must be an instance of ConfigService')
    }
    if (!(filterService instanceof FilterService)) {
      throw new TypeError('Invalid filterService: Must be an instance of FilterService')
    }
    if (!(cryptoService instanceof CryptoService)) {
      throw new TypeError('Invalid cryptoService: Must be an instance of CryptoService')
    }
    if (!(mappingService instanceof MappingService)) {
      throw new TypeError('Invalid mappingService: Must be an instance of MappingService')
    }
    if (!(statusService instanceof StatusService)) {
      throw new TypeError('Invalid statusService: Must be an instance of StatusService')
    }
    if (!(templateService instanceof TemplateService)) {
      throw new TypeError('Invalid templateService: Must be an instance of TemplateService')
    }

    this.configService = configService
    this.filterService = filterService
    this.cryptoService = cryptoService
    this.mappingService = mappingService
    this.statusService = statusService
    this.templateService = templateService

    // Tightly coupled components
    this.initiateComponents()
  }

  /**
   * @function initiateComponents
   * @description Initializes all the tightly coupled components used by the FormManager.
   * This includes handlers for events, selectors, values, focus, changes, layout, flags,
   * dropdowns, status styles, and error messages.
   * @private
   */
  initiateComponents () {
    this.eventHandler = new EventHandler(this)
    this.selectorHandler = new SelectorHandler(this)
    this.valueHandler = new ValueHandler(this)
    this.focusHandler = new FocusHandler(this)
    this.changeHandler = new ChangeHandler(this)
    this.layoutHandler = new LayoutHandler(this)
    this.flagHandler = new FlagHandler(this)
    this.dropdownHandler = new DropdownHandler(this)
    this.statusStyleHandler = new StatusStyleHandler(this)
    this.errorMessageHandler = new ErrorMessageHandler(this)
  }

  /**
   * @function connectToFields
   * @description Establishes connections to form fields using the provided selector mapping.
   * It sets up selectors, change detection, and focus detection for the form fields.
   * @param {object} fieldNameSelectorMapping - An object mapping field names to their selectors
   */
  connectToFields (fieldNameSelectorMapping) {
    this.selectorHandler.setSelectors(fieldNameSelectorMapping)
    this.changeHandler.setupChangeDetection()
    this.focusHandler.setupFocusDetection()
  }

  /**
   * @function getStreetModus
   * @description Determines the current street input mode based on the visibility of the full street input.
   * @returns {string} 'streetFull' if the full street input is visible, otherwise 'streetName'
   */
  getStreetModus () {
    const { streetFull } = this.selectorHandler.selectors
    const streetFullElement = document.querySelector(streetFull)
    const isStreetFullVisible = this.focusHandler.isVisible(streetFullElement)

    if (streetFullElement && isStreetFullVisible) {
      return 'streetFull'
    }

    return 'streetName'
  }

  /**
   * @function findOneOrManyForm
   * @description Find one or many form elements that contains the elements found by selectors
   * @returns {Array<HTMLFormElement>} An array of form elements found
   */
  findOneOrManyForm () {
    const selectorList = this.selectorHandler.getSelectors()

    if (selectorList.length === 0) {
      return []
    }

    const forms = new Set()

    // Collect all forms that match each selector
    selectorList.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(element => {
        const formElement = element.closest('form')
        if (formElement) {
          forms.add(formElement)
        }
      })
    })

    return Array.from(forms)
  }

  /**
   * @function listen
   * @description Registers an event listener for a specific event type. Usually used by data manager.
   * @param {string} eventType - The type of event to listen for
   * @param {Function} callback - The callback function to execute when the event occurs
   */
  listen (eventType, callback) {
    this.eventHandler.on(eventType, callback)
  }

  /**
   * @function changeFieldsOrder
   * @description Triggers a change in the order of form fields using the LayoutHandler.
   */
  changeFieldsOrder () {
    this.layoutHandler.changeFieldsOrder()
  }

  /**
   * @function displayStatus
   * @description Displays the status of the form or specific fields using the StatusStyleHandler.
   * @param {object} data - The data object containing status information
   * @param {object} meta - Additional metadata for status display
   */
  displayStatus (data, meta) {
    console.log("Display status", data, meta)
    this.statusStyleHandler.displayStatus(data, meta)
  }

  /**
   * @function displayErrorMessages
   * @description Displays error messages for the form or specific fields using the ErrorMessageHandler.
   * @param {object} data - The data object containing error information
   * @param {object} meta - Additional metadata for error message display
   */
  displayErrorMessages (data, meta) {
    this.errorMessageHandler.displayErrorMessages(data, meta)
  }

  /**
   * @function displayAutocompleteDropdown
   * @description Displays an autocomplete dropdown for a specific field and handles selection.
   * @param {string} fieldName - The name of the field to display the autocomplete for
   * @param {DataCollection} autocompleteCollection - A collection of autocomplete options
   */
  displayAutocompleteDropdown (fieldName, autocompleteCollection) {
    const focusedInput = this.focusHandler.findFocusedElement(fieldName)
    this.dropdownHandler.displayAutocompleteDropdown(
      focusedInput,
      autocompleteCollection,
      (selectedItem) => {
        this.valueHandler.assign(selectedItem)
        this.focusHandler.focusNextInputElement(
          this.selectorHandler.getSelectorsFromData(selectedItem)
        )
        this.eventHandler.enqueueEmit(
          EventHandler.EVENT_CHANGE,
          this.valueHandler.changes,
          () => {
            this.valueHandler.clearChanges()
          }
        )
      }
    )
  }

  /**
   * @function displayPhoneFlag
   * @description Displays a flag dropdown for phone number inputs and handles country code selection.
   * This method sets up the flag display and manages the interaction with the phone code dropdown.
   */
  displayPhoneFlag () {
    const phoneInputSelector = this.selectorHandler.getFieldNameSelector('phone')
    if (!phoneInputSelector) return
    const flagsCollection = new DataCollection(
      this.mappingService.COUNTRY_CODES_FLAGS
    )
    Array.from(document.querySelectorAll(phoneInputSelector)).forEach(anchorElement => {
      this.flagHandler.displayPhoneFlag(
        anchorElement,
        () => {
          this.dropdownHandler.displayPhoneCodeDropdown(
            anchorElement,
            flagsCollection,
            (selectedItem) => {
              const oldPhone = this.valueHandler.getFieldValue('phone')
              const oldPhoneCode = this.mappingService.mapPhoneToCode(oldPhone)
              const newPhoneCode = selectedItem.code
              const newPhone = this.mappingService.mapPhoneCodeToPhoneCode(oldPhone, oldPhoneCode, newPhoneCode)
              const fakeSelectedItem = {
                phone: newPhone
              }
              this.valueHandler.assign(fakeSelectedItem)
              this.eventHandler.enqueueEmit(
                EventHandler.EVENT_INPUT,
                this.valueHandler.changes,
                () => {
                  this.valueHandler.clearChanges()
                }
              )
            }
          )
        }
      )
    })
  }
}

export default FormManager

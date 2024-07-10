import ApiService from './ApiService'
import BaseManager from './BaseManager'
import EventHandler from './components/EventHandler'
import ConfigService from './ConfigService'
import CryptoService from './CryptoService'
import FormManager from './FormManager'
import ModalManager from './ModalManager'
import StatusService from './StatusService'
import FilterService from './FilterService'

/**
 * DataManager class for managing data, form interactions, and validation routines.
 * @augments BaseManager
 */
class DataManager extends BaseManager {
  /**
   * Create a DataManager.
   * @param {ConfigService} configService - The configuration service.
   * @param {FilterService} filterService - The filter service.
   * @param {ApiService} apiService - The API service.
   * @param {CryptoService} cryptoService - The crypto service.
   * @param {ModalManager} modalManager - The modal manager.
   * @param {FormManager} formManager - The form manager.
   * @param {StatusService} statusService - The status service.
   * @throws {TypeError} If any of the parameters are not instances of their respective classes.
   */
  constructor (configService, filterService, apiService, cryptoService, modalManager, formManager, statusService) {
    super()

    if (!(configService instanceof ConfigService)) {
      throw new TypeError('Invalid configService: Must be an instance of ConfigService')
    }

    if (!(filterService instanceof FilterService)) {
      throw new TypeError('Invalid filterService: Must be an instance of FilterService')
    }

    if (!(apiService instanceof ApiService)) {
      throw new TypeError('Invalid apiService: Must be an instance of ApiService')
    }

    if (!(cryptoService instanceof CryptoService)) {
      throw new TypeError('Invalid cryptoService: Must be an instance of CryptoService')
    }

    if (!(modalManager instanceof ModalManager)) {
      throw new TypeError('Invalid modalManager: Must be an instance of ModalManager')
    }

    if (!(formManager instanceof FormManager)) {
      throw new TypeError('Invalid formManager: Must be an instance of FormManager')
    }

    if (!(statusService instanceof StatusService)) {
      throw new TypeError('Invalid statusService: Must be an instance of StatusService')
    }

    this.configService = configService
    this.filterService = filterService
    this.apiService = apiService
    this.cryptoService = cryptoService
    this.modalManager = modalManager
    this.formManager = formManager
    this.statusService = statusService

    this.data = {

    }

    this.meta = {
      type: '',
      status: [],
      predictions: [],
      hash: ''
    }

    this.session = {
      sessionId: null,
      sessionCounter: 0
    }

    this.other = {
      dataFormat: '',
      dataType: ''
    }
  }

  /**
   * Initialize the DataManager routines.
   */
  initRoutine () {
    this.loadInitialValues()
    this.startSession()
    this.registerEventListeners()
    this.addRulesActions()
    this.setModus()
    this.displayStatus()
    this.displayErrorMessages()
  }

  /**
   * Set the modus of the DataManager. To be overwritten by subclasses. Helps figure out which data from FormManager are relevant.
   */
  setModus () {
    // Empty function to be overwritten
  }

  setFormat (dataFormat) {
    this.other.dataFormat = dataFormat
  }

  setType (dataType) {
    this.other.dataType = dataType
  }

  isValidationMeaningfull(data) {
    return true;
  }

  getCurrentHash() {
    const data = this.filterOutRelevantFields();
    return this.cryptoService.createHash(data)
  }

  /**
   * Routine to be executed after initial field value read. To be overwritten by subclasses.
   * @param {object} change - The change object.
   */
  afterValueInitialReadFieldSetRoutine (change) {
    // Empty function to be overwritten
  }

  /**
   * Routine to be executed after initial value read. To be overwritten by subclasses.
   */
  afterValueInitialReadRoutine () {
    // Empty function to be overwritten
  }

  /**
   * Routine to be executed after field value change. To be overwritten by subclasses.
   * @param {object} change - The change object.
   */
  afterValueChangeFieldSetRoutine (change) {
    // Empty function to be overwritten
  }

  /**
   * Routine to be executed after value change. To be overwritten by subclasses.
   */
  afterValueChangeRoutine () {
    // Empty function to be overwritten
  }

  /**
   * Routine to be executed after field value input. To be overwritten by subclasses.
   * @param {object} change - The change object.
   */
  afterValueInputFieldSetRoutine (change) {
    // Empty function to be overwritten
  }

  /**
   * Routine to be executed after value input. To be overwritten by subclasses.
   */
  afterValueInputRoutine () {
    // Empty function to be overwritten
  }

  /**
   * Load initial values for fields.
   */
  loadInitialValues () {
    [this.data, this.session, this.meta].forEach((dataStruct) => {
      const fieldNames = this.filterOutWritableFields(dataStruct)
      const initialFieldValues = this.formManager.valueHandler.getInitialValues(fieldNames)
      Object.keys(initialFieldValues).forEach(fieldName => {
        
        const value = initialFieldValues[fieldName]
        this.getFieldCountainer(fieldName)[fieldName] = value
      })
    })
  }

  /**
   * Start a new session if needed.
   */
  startSession () {
    if (!this.session.sessionId) {
      this.session.sessionId = this.generateSessionId()
      this.session.sessionCounter = 0
      this.syncSession()
    }
  }

  syncSession () {
    if (this.session.sessionId) {
      this.syncField('sessionId', this.session.sessionId)
      this.syncField('sessionCounter', this.session.sessionCounter)
    }
  }

  syncMeta () {
    console.log("Try to sync meta", this.meta.status,  this.meta.predictions, this.meta.hash)
    this.syncField('status', this.meta.status)
    this.syncField('predictions', this.meta.predictions)
    this.syncField('hash', this.meta.hash)
  }

  async performDoAccounting() {
    await this.apiService.doAccounting(this.session)
    this.resetSession();
  }

  /**
   * Get the container for a specific field.
   * @param {string} key - The field key.
   * @returns {object} The container object for the field.
   */
  getFieldCountainer (key) {
    if (Object.keys(this.meta).includes(key)) {
      return this.meta
    } else if (Object.keys(this.data).includes(key)) {
      return this.data
    } else if (Object.keys(this.session).includes(key)) {
      return this.session
    } else {
      return this.other
    }
  }

  /**
   * Register event listeners for form interactions.
   */
  registerEventListeners () {
    this.formManager.listen('valueInitialRead', function (listOfReads) {
      listOfReads.forEach((read) => {
        this.getFieldCountainer(read.key)[read.key] = read.newValue
        this.afterValueInitialReadFieldSetRoutine(read)
      })
      this.afterValueInitialReadRoutine()
    }.bind(this))

    this.formManager.listen('valueChange', function (listOfChanges) {
      listOfChanges.forEach((change) => {
        this.intent = 'edit'
        this.getFieldCountainer(change.key)[change.key] = change.newValue
        this.afterValueChangeFieldSetRoutine(change)
      })
      this.displayStatus()
      this.displayErrorMessages()
      this.afterValueChangeRoutine()
    }.bind(this))

    this.formManager.listen('valueInput', function (listOfChanges) {
      listOfChanges.forEach((change) => {
        this.intent = 'edit'
        this.getFieldCountainer(change.key)[change.key] = change.newValue
        this.afterValueInputFieldSetRoutine(change)
      })
      this.displayStatus()
      this.displayErrorMessages()
      this.afterValueInputRoutine()
    }.bind(this))

    this.formManager.listen(EventHandler.EVENT_BLUR, function () {
      this.executeBlurRoutine()
    }.bind(this))
  }

  /**
   * Execute the routine for when the user finishes editing the data in the form.
   */
  executeBlurRoutine () {
    console.log("Blur routine", this.intent)
    if (this.intent !== 'review') {
      this.executeValidationRoutine()
    }
  }

  /**
   * Execute the validation routine. The data is validated and the depending states are updated.
   * @returns {Promise<void>}
   */
  async executeValidationRoutine () {
    console.log("Execute executeValidationRoutine")
    const { valid, meta } = await this.validateData()
    if (!valid) {
      console.log("Not valid")
      return
    }
    console.log("Assign meta", meta)
    this.meta = meta
    this.displayStatus()
    this.displayErrorMessages()
    this.syncSession()
    this.syncMeta()
    
    await this.finishRegularPendingActions().catch(e => {
      // Potentially we can implement different strategies here.
    })
    
  }

  /**
   * Display the current status.
   */
  displayStatus () {
    const data = this.filterOutRelevantFields(this.data)
    this.formManager.displayStatus(data, this.meta)
  }

  /**
   * Display error messages.
   */
  displayErrorMessages () {
    const data = this.filterOutRelevantFields(this.data)
    this.formManager.displayErrorMessages(data, this.meta)
  }

  /**
   * Filter out writable fields from the data.
   * @param {object} [data=null] - The data object to filter. If null, uses this.data.
   * @returns {object} An object containing only the writable fields.
   */
  filterOutWritableFields (data = null) {
    if (!data) {
      data = this.data
    }
    data = JSON.parse(JSON.stringify(data));
    const relevantFields = {}
    const writableFields = Object.keys(this.formManager.selectorHandler.selectors).filter(fieldName => {
      return this.formManager.valueHandler.isFieldNameWritable(fieldName)
    })

    writableFields.forEach(field => {
      if (data[field] !== undefined) {
        relevantFields[field] = data[field]
      }
    })

    return relevantFields
  }

  /**
   * Filter out relevant fields from the data. Usually used to filter out data that will be sent to API.
   * @param {object} [data] - The data object to filter. If not provided, uses filtered writable fields.
   * @returns {object} An object containing only the relevant fields.
   */
  filterOutRelevantFields (data) {
    if (!data) {
      data = this.filterOutWritableFields()
    }

    return data
  }

  /**
   * Assign data to this manager and sync them to the form.
   * @param {object} data - The data object to assign and sync.
   */
  assignAndSyncData (data) {
    const relevantFields = this.filterOutWritableFields(data)

    Object.keys(relevantFields).forEach(fieldName => {
      const newValue = relevantFields[fieldName]
      const currentValue = this.data[fieldName]

      if (newValue !== currentValue) {
        this.data[fieldName] = newValue
        this.syncField(fieldName, newValue)
      }
    })
  }

  /**
   * Assign fake status codes for automatically copied data.
   */
  assignFakeStatusCodes () {
    const data = this.filterOutWritableFields(this.data)
    const fakeStatusCodes = this.statusService.createFakeSuccessStatusList(
      data,
      this.meta.type
    )
    this.meta.status = fakeStatusCodes
  }

  /**
   * Sync a single field's value with the form.
   * @param {string} fieldName - The name of the field to sync.
   * @param {*} value - The value to set for the field.
   */
  syncField (fieldName, value) {
    this.formManager.valueHandler.setFieldValue(fieldName, value)
  }
}

export default DataManager

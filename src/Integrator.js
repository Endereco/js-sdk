import CryptoService from './CryptoService'
import FormManager from './FormManager'
import ApiService from './ApiService'
import DOMService from './DOMService'
import TemplateService from './TemplateService'
import FilterService from './FilterService'
import StatusService from './StatusService'
import TextService from './TextService'
import ConfigService from './ConfigService'
import MappingService from './MappingService'
import AddressDataManager from './AddressDataManager'
import PersonDataManager from './PersonDataManager'
import EmailDataManager from './EmailDataManager'
import PhoneDataManager from './PhoneDataManager'
import ModalManager from './ModalManager'
import SubmissionCoordinator from './SubmissionCoordinator'
import Scanner from './Scanner'

class Integrator {
  constructor () {
    const filterService = new FilterService()
    const cryptoService = new CryptoService()
    const configService = new ConfigService(filterService)
    const mappingService = new MappingService(configService, filterService)
    const textService = new TextService(configService, filterService)
    const templateService = new TemplateService(configService, filterService)
    const domService = new DOMService(configService, filterService)
    const statusService = new StatusService(configService, filterService, textService, cryptoService)
    const apiService = new ApiService(configService, filterService, cryptoService, mappingService)
    const scanner = new Scanner(this)

    this.submissionCoordinator = new SubmissionCoordinator(configService)

    this.modalManager = new ModalManager(
      configService,
      filterService,
      templateService,
      textService,
      statusService
    )

    this.mappingService = mappingService
    this.configService = configService
    this.filterService = filterService
    this.textService = textService
    this.domService = domService

    this.integratedObjects = {}

    this.cryptoService = cryptoService
    this.statusService = statusService
    this.templateService = templateService
    this.apiService = apiService
    this.scanner = scanner

    this.onLoad = []
    this.delayedInits = []
    this.ready = false
  }

  createFormManager (name) {
    const formManager = new FormManager(
      this.configService,
      this.filterService,
      this.cryptoService,
      this.mappingService,
      this.statusService,
      this.templateService
    )
    formManager.name = name
    return formManager
  }

  createDataManager (type, options) {
    const formManager = this.createFormManager(options.name)
    formManager.connectToFields(options.selectors)

    const DataManagerClass = {
      address: AddressDataManager,
      email: EmailDataManager,
      phone: PhoneDataManager,
      person: PersonDataManager
    }[type]

    const dataManager = new DataManagerClass(
      this.configService,
      this.filterService,
      this.apiService,
      this.cryptoService,
      this.modalManager,
      formManager,
      this.statusService
    )

    const serviceConfig = this.configService.getConfig(type + 'Services')
    dataManager.name = options.name
    dataManager.other.dataType = (options.dataType && options.dataType.trim() !== '')
      ? options.dataType
      : (serviceConfig.defaultDataType && serviceConfig.defaultDataType.trim() !== '')
          ? serviceConfig.defaultDataType
          : ''

    dataManager.other.dataFormat = (options.dataFormat && options.dataFormat.trim() !== '')
      ? options.dataFormat
      : (serviceConfig.defaultDataFormat && serviceConfig.defaultDataFormat.trim() !== '')
          ? serviceConfig.defaultDataFormat
          : ''

    this.submissionCoordinator.watch(formManager.findOneOrManyForm())
    this.submissionCoordinator.addSubscriber(dataManager)
    this.integratedObjects[options.name] = dataManager

    return { formManager, dataManager }
  }

  initPhoneServices (selectors, options) {
    const { formManager, dataManager } = this.createDataManager('phone', { ...options, selectors })
    formManager.displayPhoneFlag()
    return dataManager
  }

  initAMS (selectors, options) {
    const { formManager, dataManager } = this.createDataManager('address', { ...options, selectors })
    formManager.changeFieldsOrder()
    return dataManager
  }

  initEmailServices (selectors, options) {
    const { dataManager } = this.createDataManager('email', { ...options, selectors })
    return dataManager
  }

  initPersonServices (selectors, options) {
    const { dataManager } = this.createDataManager('person', { ...options, selectors })
    return dataManager
  }
}

export default Integrator

import FilterService from './FilterService'

class ConfigService {
  constructor (filterService) {
    if (!(filterService instanceof FilterService)) {
      throw new TypeError('Invalid filterService: Must be an instance of FilterService')
    }
    this.filterService = filterService

    this.configs = {
      integrator: {
        themeName: 'default',
        injectCss: 'inline',
        cssFilePath: '',
        cssCompiled: '',
        loggingTarget: 'skip'
      },
      modals: {
        showClose: true,
        showConfirmCheckbox: true,
        buttonClass: 'btn btn-primary'
      },
      addressModals: {
        confirmWithCheckbox: true
      },
      api: {
        apiKey: '',
        apiUrl: '',
        proxyUrl: '',
        requestTimeout: 6000,
        clientName: 'Default JS-SDK Client v2.0.0'
      },
      addressServices: {
        defaultCountryCode: 'DE',
        autocompleteFields: true,
        validateOnBlur: true,
        validateOnSubmit: true,
        changeFieldsOrder: true,
        defaultDataType: '',
        defaultDataFormat: ''
      },
      phoneServices: {
        validateOnBlur: true,
        validateOnSubmit: true,
        showErrorMessages: true,
        showPhoneFlag: true,
        defaultCountryCode: 'DE',
        defaultDataType: '',
        defaultDataFormat: 'E164'
      },
      emailServices: {
        validateOnBlur: true,
        validateOnSubmit: true,
        showErrorMessages: true,
        defaultDataType: '',
        defaultDataFormat: ''
      },
      personServices: {
        validateOnBlur: true,
        validateOnSubmit: true,
        showErrorMessages: true,
        defaultDataType: '',
        defaultDataFormat: ''
      }
    }
  }

  /**
   * Sets the configuration for a specific category.
   * @param {string} category - The category of configuration to set.
   * @param {object} newConfig - The new configuration settings.
   */
  setConfig (category, newConfig) {
    if (this.configs[category]) {
      this.configs[category] = { ...this.configs[category], ...newConfig }
    } else {
      throw new Error(`Config category ${category} does not exist.`)
    }
  }

  /**
   * Gets the texts for a specific category.
   * @param {string} category - The category of texts to retrieve.
   * @returns {object} The texts for the specified category.
   */
  getConfig (category) {
    const config = this.configs[category] || {}
    const finalConfig = this.filterService.filter(
      'ConfigService.getConfig',
      config,
      {
        category
      }
    )
    return config
  }
}
export default ConfigService

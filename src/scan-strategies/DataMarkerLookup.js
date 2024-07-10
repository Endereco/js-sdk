class DataMarkerLookup {
  DATA_MARKER_SELECTOR = ''
  
  DATA_SELECTOR_ATTRIBUTES = {
    salutation: 'data-salutation-selector',
    firstName: 'data-first-name-selector',
    lastName: 'data-last-name-selector',
    title: 'data-title-selector',
    phone: 'data-phone-selector',
    email: 'data-email-selector',
    countryCode: 'data-country-code-selector',
    subdivisionCode: 'data-subdivision-code-selector',
    postalCode: 'data-postal-code-selector',
    locality: 'data-locality-selector',
    streetFull: 'data-street-full-selector',
    streetName: 'data-street-name-selector',
    buildingNumber: 'data-building-number-selector',
    additionalInfo: 'data-additional-info-selector',
    sessionId: 'data-session-id-selector',
    sessionCounter: 'data-session-counter-selector',
    status: 'data-status-selector',
    predictions: 'data-predictions-selector',
    hash: 'data-hash-selector'
  }

  DATA_OPTIONS_ATTRIBUTES = {
    name: 'data-name',
    dataType: 'data-type',
    dataFormat: 'data-format',
    errorContainerSelector: 'data-error-container-selector'
  }

  execute (integrator) {
    // To be implemented in child classes
  }

  getSelectors (DOMElement) {
    const selectorMapping = {}

    for (const [key, attributeName] of Object.entries(this.DATA_SELECTOR_ATTRIBUTES)) {
      if (DOMElement.hasAttribute(attributeName)) {
        selectorMapping[key] = DOMElement.getAttribute(attributeName)
      }
    }

    return selectorMapping
  }

  getOptions (DOMElement) {
    const options = {}

    for (const [key, attributeName] of Object.entries(this.DATA_OPTIONS_ATTRIBUTES)) {
      if (DOMElement.hasAttribute(attributeName)) {
        options[key] = DOMElement.getAttribute(attributeName)
      }
    }

    return options
  }

  markAsProcessed(DOMElement) {
    DOMElement.setAttribute('data-has-object', 'yes')
  }
}

export default DataMarkerLookup

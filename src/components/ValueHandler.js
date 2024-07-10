class ValueHandler {
  constructor (formManager) {
    this.formManager = formManager
    this.changes = []
  }

  addChange (change) {
    this.changes.push(change)
  }

  clearChanges () {
    this.changes = []
  }

  isElementWritable (DOMElement) {
    return !DOMElement.readOnly && !DOMElement.disabled
  }

  isSelectorWritable (selector) {
    const elements = document.querySelectorAll(selector)
    return Array.from(elements).some(element => {
      return this.isElementWritable(element)
    })
  }

  isFieldNameWritable (fieldName) {
    const selector = this.formManager.selectorHandler.getFieldNameSelector(fieldName)
    if (!selector) return false
    return this.isSelectorWritable(selector)
  }

  getFieldValue (fieldName) {
    const value = this.getFieldValueRaw(fieldName)
    return this.decodeValue(fieldName, value)
  }

  getFieldValueRaw (fieldName) {
    const selector = this.formManager.selectorHandler.getFieldNameSelector(fieldName)
    const value = this.getElementValue(selector)
    return value
  }

  assign (data) {
    Object.keys(data).forEach(fieldName => {
      if (this.isFieldNameWritable(fieldName)) {
        const oldValue = this.getFieldValue(fieldName)
        const newValue = data[fieldName]
        this.addChange({
          key: fieldName,
          oldValue,
          newValue,
          active: false
        })
        this.setFieldValue(fieldName, newValue)
      }
    })
  }

  setFieldValue (fieldName, value) {
    const selector = this.formManager.selectorHandler.getFieldNameSelector(fieldName)
    const encodedValue = this.encodeValue(fieldName, value)
    this.formManager.changeHandler.blockChangeListenerInterval(fieldName)
    this.setElementValue(selector, encodedValue)
    this.formManager.changeHandler.unblockChangeListenerInterval(fieldName)
  }

  getElementValue (selector) {
    const elements = Array.from(document.querySelectorAll(selector))
      .filter(element => !element.disabled)

    if (elements.length === 0) return null
    if (elements.length === 1) return this.getSingleElementValue(elements[0])
    return this.getMultipleElementsValue(elements)
  }

  setElementValue (selector, value) {
    const elements = document.querySelectorAll(selector)
    elements.forEach(element => this.setSingleElementValue(element, value))
  }

  getSingleElementValue (element) {
    if (element.type === 'checkbox') return element.checked
    if (element.type === 'radio') {
      const checkedRadio = document.querySelector(`${element.name}:checked`)
      return checkedRadio ? checkedRadio.value : null
    }
    if (element.tagName.toLowerCase() === 'select' && element.multiple) {
      return Array.from(element.options)
        .filter(option => option.selected)
        .map(option => option.value)
    }
    return element.value
  }

  getMultipleElementsValue (elements) {
    return elements.reduce((values, element) => {
      if (element.type === 'checkbox' && element.checked) values.push(element.value)
      else if (element.type === 'radio' && element.checked) values.push(element.value)
      else if (element.tagName.toLowerCase() === 'select' && element.multiple) {
        values.push(...Array.from(element.options)
          .filter(option => option.selected)
          .map(option => option.value))
      } else values.push(element.value)
      return values
    }, [])
  }

  setSingleElementValue (element, value) {
    if (element.type === 'checkbox') {
      element.checked = Array.isArray(value) ? value.includes(element.value) : Boolean(value)
    } else if (element.type === 'radio') {
      element.checked = element.value === value
    } else if (element.tagName.toLowerCase() === 'select' && element.multiple) {
      if (Array.isArray(value)) {
        Array.from(element.options).forEach(option => {
          option.selected = value.includes(option.value)
        })
      }
    } else {
      element.value = value
    }
  }

  decodeValue(fieldName, value) {
    if (value == null || value === '') {
      return value;
    }
  
    switch (fieldName) {
      case 'subdivisionCode': {
        const countryCode = this.getFieldValue('countryCode');
        return this.formManager.mappingService.getSubdivisionCode(value, countryCode) || value;
      }
      case 'countryCode':
        return this.formManager.mappingService.getCountryCode(value) || value;
      case 'status':
        return typeof value === 'string' ? value.split(',') : [value];
      case 'predictions':
        try {
          return JSON.parse(value);
        } catch (error) {
          console.error(`Error parsing predictions: ${error.message}`);
          return [];
        }
      default:
        return value;
    }
  }

  encodeValue(fieldName, value) {
    if (value == null || value === '') {
      return value;
    }
  
    switch (fieldName) {
      case 'subdivisionCode': {
        const countryCode = this.getFieldValue('countryCode');
        return this.formManager.mappingService.getSubdivisionId(value, countryCode) || value;
      }
      case 'countryCode':
        return this.formManager.mappingService.getCountryId(value) || value;
      case 'status':
        return Array.isArray(value) ? value.join(',') : value;
      case 'predictions':
        try {
          return JSON.stringify(value) || '';
        } catch (error) {
          console.error(`Error stringifying predictions: ${error.message}`);
          return '';
        }
      default:
        return value;
    }
  }

  getInitialValues (fieldNames) {
    const fieldValues = {}
    Object.keys(fieldNames).forEach(fieldName => {
      fieldValues[fieldName] = this.getFieldValue(fieldName)
    })
    return fieldValues
  }
}

export default ValueHandler

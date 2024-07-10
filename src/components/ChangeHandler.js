import EventHandler from './EventHandler'

class ChangeHandler {
  constructor (formManager) {
    this.eventHandler = formManager.eventHandler
    this.selectorHandler = formManager.selectorHandler
    this.valueHandler = formManager.valueHandler
    this.focusHandler = formManager.focusHandler
    this.initialValuesRegistry = {}
    this.runningIntervals = {}
    this.intervalBlocked = {}
  }

  setupChangeDetection () {
    Object.keys(this.selectorHandler.selectors).forEach(fieldName => {
      const selector = this.selectorHandler.getFieldNameSelector(fieldName)
      if (!selector) return

      this.removeAutocomplete(selector)

      this.initialValuesRegistry[fieldName] = this.valueHandler.getFieldValue(fieldName)
      this.setupChangeListenerInterval(fieldName, selector, this.reportChange, this.reportInput)
    })
  }

  removeAutocomplete (selector) {
    const isChrome = /chrom(e|ium)/.test(navigator.userAgent.toLowerCase())
    const autocompleteValue = isChrome
      ? 'autocomplete_' + Math.random().toString(36).substring(2) + Date.now()
      : 'off'

    document.querySelectorAll(selector).forEach(DOMElement => {
      if (['text', 'number'].includes(DOMElement.type)) {
        DOMElement.setAttribute('autocomplete', autocompleteValue)
      }
    })
  }

  setupChangeListenerInterval (fieldName, selector, callbackForChange, callbackForInput) {
    const intervalName = fieldName + 'ChangeListenerInterval'
    this.intervalBlocked[intervalName] = false
    this.runningIntervals[intervalName] = setInterval(() => {
      if (this.intervalBlocked[intervalName]) return
      const newValue = this.valueHandler.getFieldValue(fieldName)
      if (!this.areValuesEqual(newValue, this.initialValuesRegistry[fieldName])) {
        const oldValue = this.initialValuesRegistry[fieldName]
        this.initialValuesRegistry[fieldName] = newValue
        if (!this.focusHandler.anyElementsInFocus(selector)) {
          callbackForChange.bind(this)(fieldName, oldValue, newValue)
        } else {
          callbackForInput.bind(this)(fieldName, oldValue, newValue)
        }
      }
    }, 1)
  }

  areValuesEqual(value1, value2) {
    // TODO: probably I should use _.isEqual() instead of this.
    const val1 = JSON.stringify([value1])
    const val2 = JSON.stringify([value2])
    return val1 === val2
  }

  blockChangeListenerInterval (fieldName) {
    const intervalName = fieldName + 'ChangeListenerInterval'
    this.intervalBlocked[intervalName] = true
  }

  unblockChangeListenerInterval (fieldName, resetInitialValues = true) {
    const intervalName = fieldName + 'ChangeListenerInterval'
    if (resetInitialValues) {
      this.initialValuesRegistry[fieldName] = this.valueHandler.getFieldValue(fieldName)
    }
    this.intervalBlocked[intervalName] = false
  }

  reportChange (key, oldValue, newValue) {
    this.valueHandler.addChange(
      {
        key,
        oldValue,
        newValue,
        active: this.focusHandler.anyElementsInFocus(this.selectorHandler.selectors[key])
      }
    )
    this.eventHandler.enqueueEmit(
      EventHandler.EVENT_CHANGE,
      this.valueHandler.changes,
      () => {
        this.valueHandler.clearChanges()
      }
    )
  }

  reportInput (key, oldValue, newValue) {
    this.valueHandler.addChange(
      {
        key,
        oldValue,
        newValue,
        active: this.focusHandler.anyElementsInFocus(this.selectorHandler.selectors[key])
      }
    )
    this.eventHandler.enqueueEmit(
      EventHandler.EVENT_INPUT,
      this.valueHandler.changes,
      () => {
        this.valueHandler.clearChanges()
      }
    )
  }
}

export default ChangeHandler

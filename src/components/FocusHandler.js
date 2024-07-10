// This components main tasks is to recognize if a field is focus or focusable in the first place
// It should also realise the blur event, in our case that is a combination of field getting unfocused and
// no other relevant field having a focus

import EventHandler from './EventHandler'

class FocusHandler {
  constructor (formManager) {
    this.formManager = formManager
    this.waitingUnfocusRegistry = {}
    this.blurListeners = []
  }

  setupFocusDetection () {
    Object.values(this.formManager.selectorHandler.selectors).forEach(selector => {
      
      const elements = document.querySelectorAll(selector)
      elements.forEach(element => {
        if (!this.isFocusable(element)) {
          return
        }
        this.setupFocusDetectionInterval(element)
      })
    })
  }

  setupFocusDetectionInterval (element) {
    setInterval(() => {
      const isFocused = document.activeElement === element
      if (isFocused && !this.waitingUnfocusRegistry[element]) {
        console.log("I should be executed only once")
        this.setupUnfocusDetection(element)
      }
    }, 10)
  }

  setupUnfocusDetection (element) {
    console.log("Set up unfocus")
    this.waitingUnfocusRegistry[element] = setTimeout(() => {
      const isFocused = document.activeElement === element
      if (isFocused || this.formManager.eventHandler.isProcessing) {
        this.setupUnfocusDetection(element)
      } else {
        this.waitingUnfocusRegistry[element] = null
        if (!this.formInFocus()) {
          this.reportUnfocus()
        }
      }
    }, 50)
  }

  formInFocus () {
    return Object.values(this.formManager.selectorHandler.selectors).some(selector => this.anyElementsInFocus(selector))
  }

  anyElementsInFocus (selector) {
    return Array.from(document.querySelectorAll(selector)).some(element => document.activeElement === element)
  }

  findFocusedElement (fieldName) {
    const selector = this.formManager.selectorHandler.selectors[fieldName]
    if (!selector) {
      return null
    }

    const active = Array.from(document.querySelectorAll(selector)).find(element => document.activeElement === element)
    return active || null
  }

  isFocusable (element) {
    return element.tabIndex >= 0 && !element.disabled
  }

  isVisible (element) {
    const style = window.getComputedStyle(element)
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && element.offsetParent !== null
  }

  getManuallyFocusableElements (selectors) {
    const focusableElements = []

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)

      elements.forEach(element => {
        if (document.contains(element) && this.isFocusable(element) && this.isVisible(element)) {
          focusableElements.push(element)
        }
      })
    })

    return focusableElements
  }

  getAllFocusableElements () {
    const focusableElements = []

    document.querySelectorAll('input, select, textarea, button, [tabindex]').forEach(element => {
      if (document.contains(element) && this.isFocusable(element) && this.isVisible(element)) {
        focusableElements.push(element)
      }
    })

    return focusableElements
  }

  focusNextInputElement (usedSelectors) {
    const preferredSelectors = this.formManager.selectorHandler.getSelectors()
    const focusableElements = this.getAllFocusableElements()
    const preferredElements = this.getManuallyFocusableElements(preferredSelectors)

    const unusedPreferredElements = preferredElements.filter(element => !usedSelectors.includes(element))
    const emptyPreferredElements = unusedPreferredElements.filter(element => element.value === '')

    if (emptyPreferredElements.length > 0) {
      const nextElement = emptyPreferredElements[0]
      nextElement.focus()
      return nextElement
    }

    let highestIndex = -1

    usedSelectors.forEach(selector => {
      const element = document.querySelector(selector)
      if (element) {
        const index = focusableElements.indexOf(element)
        if (index > highestIndex) {
          highestIndex = index
        }
      }
    })

    if (highestIndex === -1) {
      console.warn('None of the provided selectors are focusable')
      return null
    }

    for (let i = highestIndex + 1; i < focusableElements.length; i++) {
      const nextElement = focusableElements[i]
      if (nextElement && nextElement.value === '') {
        nextElement.focus()
        return nextElement
      }
    }

    console.warn('No next empty input element found')
    return null
  }

  reportUnfocus () {
    this.formManager.eventHandler.emit(
      EventHandler.EVENT_BLUR
    )
  }
}

export default FocusHandler

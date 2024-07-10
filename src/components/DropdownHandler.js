import Mustache from 'mustache'
import { diffChars } from 'diff'

const CLASS_NAMES = {
  ADD: 'endereco-span--add',
  REMOVE: 'endereco-span--remove',
  NEUTRAL: 'endereco-span--neutral'
}

class DropdownHandler {
  constructor (formManager) {
    this.formManager = formManager
    this.dropdownRegistry = new Map()
    this.keyListenerRegistry = new Map()
    this.clickAwayListenerRegistry = new Map()
  }

  displayAutocompleteDropdown (anchorElement, autocompleteCollection, callbackOnSelect, selectedIndex = 1) {
    this.removeDropdown(anchorElement)

    if (!autocompleteCollection.length) return

    const uniqueID = this.formManager.cryptoService.generateUniqueID()
    const template = this.formManager.templateService.getAutocompleteDropdownTemplate(autocompleteCollection.fieldName)
    const highlightedPredictions = this.highlightPredictionDifferences(autocompleteCollection)

    const renderedHtml = this.render(template, {
      uniqueID,
      predictions: highlightedPredictions,
      direction: getComputedStyle(anchorElement).direction,
      longList: highlightedPredictions.length > 6,
      selectedIndex
    })

    this.insertIntoDOM(anchorElement, renderedHtml, uniqueID)
    this.addKeysListener(
      anchorElement,
      autocompleteCollection,
      callbackOnSelect,
      selectedIndex,
      this.displayAutocompleteDropdown.bind(this)
    )
    this.addClickAwayListener(anchorElement, uniqueID)
    this.addClickListener(anchorElement, autocompleteCollection, callbackOnSelect, uniqueID)
    this.positionDropdown(anchorElement, uniqueID)
  }

  displayPhoneCodeDropdown (anchorElement, flagsCollection, callbackOnSelect, selectedIndex = 1) {
    this.removeDropdown(anchorElement)
    const uniqueID = this.formManager.cryptoService.generateUniqueID()
    const template = this.formManager.templateService.getPhoneCodeDropdownTemplate()

    const renderedHtml = this.render(
      template,
      {
        uniqueID,
        flags: flagsCollection.items,
        direction: getComputedStyle(anchorElement).direction,
        longList: flagsCollection.length > 6,
        selectedIndex
      }
    )

    this.insertIntoDOM(anchorElement, renderedHtml, uniqueID)

    this.addKeysListener(
      anchorElement,
      flagsCollection,
      callbackOnSelect,
      selectedIndex,
      this.displayPhoneCodeDropdown.bind(this)
    )
    this.addClickAwayListener(anchorElement, uniqueID)
    this.addClickListener(anchorElement, flagsCollection, callbackOnSelect, uniqueID)
    this.positionDropdown(anchorElement, uniqueID)
  }

  removeDropdown (anchorElement) {
    const dropdownId = this.dropdownRegistry.get(anchorElement)
    const dropdown = document.getElementById(dropdownId)
    if (dropdown) {
      dropdown.parentNode.removeChild(dropdown)
    }
    this.removeKeysListener(anchorElement)
    this.removeClickAwayListener(anchorElement)
  }

  insertIntoDOM (anchorElement, html, uniqueID) {
    anchorElement.insertAdjacentHTML('afterend', html)
    this.dropdownRegistry.set(anchorElement, uniqueID)
  }

  addClickListener (anchorElement, dataCollection, callbackOnSelect, uniqueID) {
    const dropdown = document.getElementById(uniqueID)
    if (dropdown) {
      dropdown.querySelectorAll('[endereco-collection-item]').forEach((item, index) => {
        item.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          const selectedItem = this.getSelectedItem(dataCollection, index + 1)
          this.removeDropdown(anchorElement)
          callbackOnSelect(selectedItem)
        })
        item.addEventListener('mousedown', (e) => {
          e.preventDefault()
          e.stopPropagation()
        })
      })
    }
  }

  addKeysListener (anchorElement, dataCollection, callbackOnSelect, selectedIndex, renderCallback) {
    const keyListener = (event) => {
      let selectedItem
      switch (event.key) {
        case 'ArrowUp':
        case 'Up':
          selectedIndex = Math.max(0, selectedIndex - 1)
          renderCallback(anchorElement, dataCollection, callbackOnSelect, selectedIndex)
          break
        case 'ArrowDown':
        case 'Down':
          selectedIndex = Math.min(dataCollection.length, selectedIndex + 1)
          renderCallback(anchorElement, dataCollection, callbackOnSelect, selectedIndex)
          break
        case 'Tab':
        case 'Enter':
          event.preventDefault() // Prevent form submission on 'Enter'
          event.stopPropagation()
          selectedItem = this.getSelectedItem(dataCollection, selectedIndex)
          this.removeDropdown(anchorElement)
          callbackOnSelect(selectedItem)
          break
      }
    }
    anchorElement.addEventListener('keydown', keyListener)
    this.keyListenerRegistry.set(anchorElement, keyListener)
  }

  addClickAwayListener (anchorElement, dropdownID) {
    const listener = this.createClickAwayListener(anchorElement, dropdownID)
    this.clickAwayListenerRegistry.set(anchorElement, listener)
    document.addEventListener('click', listener)
  }

  createClickAwayListener (anchorElement, dropdownID) {
    return (event) => {
      const dropdown = document.getElementById(dropdownID)
      if (dropdown && !anchorElement.contains(event.target) && !dropdown.contains(event.target)) {
        this.removeDropdown(anchorElement)
      }
    }
  }

  removeClickAwayListener (anchorElement) {
    const listener = this.clickAwayListenerRegistry.get(anchorElement)
    if (listener) {
      document.removeEventListener('click', listener)
      this.clickAwayListenerRegistry.delete(anchorElement)
    }
  }

  removeKeysListener (anchorElement) {
    const keyListener = this.keyListenerRegistry.get(anchorElement)
    if (keyListener) {
      anchorElement.removeEventListener('keydown', keyListener)
      this.keyListenerRegistry.delete(anchorElement)
    }
  }

  getSelectedItem (dataCollection, selectedIndex) {
    return dataCollection.items[selectedIndex - 1] || null
  }

  positionDropdown (anchorElement, uniqueID) {
    const dropdown = document.getElementById(uniqueID)
    if (dropdown) {
      const { offsetTop, offsetLeft, offsetHeight, offsetWidth } = anchorElement
      dropdown.style.top = `${offsetTop + offsetHeight}px`
      dropdown.style.left = `${offsetLeft}px`
      dropdown.style.width = `${offsetWidth}px`
    }
  }

  highlightPredictionDifferences (autocompleteCollection) {
    const { originalData, items, fieldName } = autocompleteCollection
    const originalInputString = originalData[fieldName]
    const predictionsCopy = JSON.parse(JSON.stringify(items))

    return predictionsCopy.map(prediction => {
      const inputToCompare = prediction[fieldName]
      const diff = diffChars(originalInputString, inputToCompare, { ignoreCase: true })
      const diffHtml = diff.map(part => {
        const markClass = part.added ? CLASS_NAMES.ADD : part.removed ? CLASS_NAMES.REMOVE : CLASS_NAMES.NEUTRAL
        const value = part.value.replace(/[ ]/g, '&nbsp;')
        return `<span class="${markClass}">${value}</span>`
      }).join('')

      prediction[`${fieldName}Diff`] = diffHtml
      return prediction
    })
  }

  render (template, data) {
    let startingIndex = 1
    return Mustache.render(template, {
      ...data,
      index: () => startingIndex - 1,
      isActive: () => {
        const isActive = startingIndex === data.selectedIndex
        startingIndex++
        return isActive
      }
    })
  }
}

export default DropdownHandler

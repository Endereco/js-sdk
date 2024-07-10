class SelectorHandler {
  constructor (formManager) {
    this.formManager = formManager
    this.possibleSelectors = {}
    this.selectors = {}
  }

  getSelectorsWithFieldNames () {
    return Object.keys(this.selectors).map(fieldName => ({
      fieldName,
      selector: this.selectors[fieldName]
    }))
  }

  getFieldNameSelector (fieldName) {
    return this.selectors[fieldName] || null
  }

  getFieldNames () {
    return Object.keys(this.selectors)
  }

  getSelectors () {
    return Object.values(this.selectors)
  }

  getSelectorsFromData (data) {
    const listOfSelectors = []
    Object.keys(data).forEach(fieldName => {
      const selector = this.getFieldNameSelector(fieldName)
      if (selector) {
        listOfSelectors.push(selector)
      }
    })
    return listOfSelectors
  }

  setSelectors (selectors) {
    this.possibleSelectors = selectors
    this.selectors = this.validateSelectors(selectors)
  }

  validateSelectors (selectors) {
    const filteredSelectors = {}

    for (const key in selectors) {
      if (Object.hasOwn(selectors, key)) {
        const selector = selectors[key]
        const elements = document.querySelectorAll(selector)

        if (elements.length > 0 && Array.from(elements).some(element => !element.disabled)) {
          filteredSelectors[key] = selector
        }
      }
    }

    return filteredSelectors
  }
}

export default SelectorHandler

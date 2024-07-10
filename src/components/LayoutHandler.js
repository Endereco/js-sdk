class LayoutHandler {
  constructor (formManager) {
    this.formManager = formManager
    this.parentLineCollector = {}
  }

  changeFieldsOrder (fieldNamesOrder = [
    'countryCode',
    'subdivisionCode',
    'postalCode',
    'locality',
    'streetFull',
    'streetName',
    'buildingNumber',
    'additionalInfo'
  ]) {
    Object.keys(this.formManager.selectorHandler.selectors).forEach(key => {
      this.createParentLine(key)
    })

    const reversedArrayOfFieldsNames = []
    for (let i = fieldNamesOrder.length - 1; i >= 0; i--) {
      if (document.querySelector(this.formManager.selectorHandler.selectors[fieldNamesOrder[i]])) {
        reversedArrayOfFieldsNames.push(fieldNamesOrder[i])
      }
    }

    for (let j = 0; j < (reversedArrayOfFieldsNames.length - 1); j++) {
      this.firstBeforeSecond(
        reversedArrayOfFieldsNames[j + 1],
        reversedArrayOfFieldsNames[j]
      )
    }
  }

  createParentLine (fieldName) {
    if (document.querySelector(this.formManager.selectorHandler.selectors[fieldName])) {
      this.parentLineCollector[fieldName] = {
        commonElementIndex: 0,
        rowElementIndex: 0,
        columnElementIndex: 0,
        parentLine: [document.querySelector(this.formManager.selectorHandler.selectors[fieldName])]
      }
      while (1) {
        if (this.parentLineCollector[fieldName].parentLine[this.parentLineCollector[fieldName].parentLine.length - 1].parentNode) {
          const temp = this.parentLineCollector[fieldName].parentLine[this.parentLineCollector[fieldName].parentLine.length - 1].parentNode
          this.parentLineCollector[fieldName].parentLine.push(temp)
        } else {
          break
        }
      }
    }
  }

  firstBeforeSecond (firstFieldName, secondFieldName) {
    if (!this.parentLineCollector[firstFieldName] || !this.parentLineCollector[secondFieldName]) {
      return
    }

    const firstFieldData = this.parentLineCollector[firstFieldName]
    let firstFieldIndex = 0
    const secondFieldData = this.parentLineCollector[secondFieldName]
    let secondFieldIndex = 0
    let commonParentDOM

    if (firstFieldData.parentLine && secondFieldData.parentLine) {
      firstFieldData.parentLine.forEach((firstFieldParentDOM) => {
        if (commonParentDOM) return
        secondFieldIndex = 0
        secondFieldData.parentLine.forEach((secondFieldParentDOM) => {
          if (commonParentDOM) return
          if (firstFieldParentDOM === secondFieldParentDOM) {
            commonParentDOM = firstFieldParentDOM
            firstFieldData.commonElementIndex = firstFieldIndex
            firstFieldData.rowElementIndex = Math.max(firstFieldIndex - 1, 0)
            firstFieldData.columnElementIndex = Math.max(firstFieldIndex - 2, 0)
            secondFieldData.commonElementIndex = secondFieldIndex
            secondFieldData.rowElementIndex = Math.max(secondFieldIndex - 1, 0)
            secondFieldData.columnElementIndex = Math.max(secondFieldIndex - 2, 0)
          }
          secondFieldIndex++
        })
        firstFieldIndex++
      })

      if (commonParentDOM) {
        commonParentDOM.insertBefore(
          firstFieldData.parentLine[firstFieldData.rowElementIndex],
          secondFieldData.parentLine[secondFieldData.rowElementIndex]
        )
      }
    }
  }

  getParents (element) {
    const parents = []
    let currentElement = element.parentElement

    while (currentElement) {
      parents.push(currentElement)
      currentElement = currentElement.parentElement
    }

    return parents
  }
}

export default LayoutHandler

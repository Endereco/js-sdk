class StatusStyleHandler {
  CSS_STATUS_STYLES = {
    correct: 'endereco-s--correct',
    wrong: 'endereco-s--incorrect'
  }

  constructor (formManager) {
    this.formManager = formManager
  }

  displayStatus (data, meta) {
    this.formManager.selectorHandler.getSelectorsWithFieldNames().forEach(item => {
      const { fieldName, selector } = item
      Array.from(document.querySelectorAll(selector)).forEach(element => {
        const statusDisplayElement = this.getStatusDisplayElement(element)
        const styleClasses = this.getFieldStatusStyleClasses(meta, data, fieldName)
        this.setStatusStyleClasses(statusDisplayElement, styleClasses)
      })
    })
  }

  getFieldStatusStyleClasses (meta, data, fieldName) {
    if (!this.formManager.cryptoService.compareHash(meta.hash, data)) {
      return []
    }
    const statuses = this.formManager.statusService.getStatuses(meta.status, meta.type, fieldName)

    if (this.formManager.statusService.hasAnyError(statuses)) {
      return [this.CSS_STATUS_STYLES.wrong]
    } else if (this.formManager.statusService.hasAllSuccess(statuses)) {
      return [this.CSS_STATUS_STYLES.correct]
    } else {
      return []
    }
  }

  getStatusDisplayElement (anchorElement) {
    return anchorElement
  }

  setStatusStyleClasses (element, cssClasses) {
    const statusClasses = Object.values(this.CSS_STATUS_STYLES)
    const classesToRemove = statusClasses.slice()

    cssClasses.forEach(cssClass => {
      if (classesToRemove.includes(cssClass)) {
        classesToRemove.splice(classesToRemove.indexOf(cssClass), 1)
      }
    })

    classesToRemove.forEach(cssClass => {
      if (element.classList.contains(cssClass)) {
        element.classList.remove(cssClass)
      }
    })

    cssClasses.forEach(cssClass => {
      if (!element.classList.contains(cssClass)) {
        element.classList.add(cssClass)
      }
    })
  }
}

export default StatusStyleHandler

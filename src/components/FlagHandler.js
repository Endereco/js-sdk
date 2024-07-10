import Mustache from 'mustache'

class FlagHandler {
  constructor (formManager) {
    this.formManager = formManager
    this.flagRegistry = new Map()
  }

  displayPhoneFlag (anchorElement, callbackOnClick) {
    const phoneNumber = anchorElement.value // TODO: refactor to use valueHandler (need a function to read from element)
    const flagSvg = this.formManager.mappingService.mapPhoneToFlag(phoneNumber)
    const phoneCode = this.formManager.mappingService.mapPhoneToCode(phoneNumber)
    let uniqueID = this.flagRegistry.get(anchorElement)

    if (uniqueID) {
      this.replaceFlagIcon(flagSvg, uniqueID)
      this.setPhoneCodeToFlag(phoneCode, uniqueID)
    } else {
      uniqueID = this.formManager.cryptoService.generateUniqueID()
      this.insertIntoDOM(flagSvg, anchorElement, uniqueID)
      this.flagRegistry.set(anchorElement, uniqueID)
      this.addClickListenerToFlag(anchorElement, uniqueID, callbackOnClick)
      this.setPhoneCodeToFlag(phoneCode, uniqueID)
    }

    this.positionFlag(anchorElement, uniqueID)
    this.startFlagRepositionInterval(anchorElement, uniqueID)
  }

  replaceFlagIcon (newSVG, uniqueID) {
    const flagElement = document.getElementById(uniqueID)
    flagElement.querySelector('.endereco-flag').innerHTML = newSVG
  }

  setPhoneCodeToFlag (phoneCode, uniqueID) {
    const flagElement = document.getElementById(uniqueID)
    flagElement.setAttribute('endereco-parsed-phone-code', phoneCode)
  }

  insertIntoDOM (flagSvg, anchorElement, uniqueID) {
    const template = this.formManager.templateService.getPhoneFlagTemplate()
    const renderedHTML = Mustache.render(template, { uniqueID, flag: flagSvg })
    anchorElement.insertAdjacentHTML('beforebegin', renderedHTML)
  }

  addClickListenerToFlag (anchorElement, uniqueID, callbackOnClick) {
    const flagElement = document.getElementById(uniqueID)
    if (flagElement) {
      flagElement.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
      })
      flagElement.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        anchorElement.focus()
        callbackOnClick()
      })
    }
  }

  startFlagRepositionInterval (anchorElement, uniqueID) {
    const repositionInterval = setInterval(() => {
      const flag = document.getElementById(uniqueID)
      if (!flag) {
        clearInterval(repositionInterval)
        return
      }
      this.positionFlag(anchorElement, uniqueID)
    }, 10)
  }

  positionFlag (anchorElement, uniqueID) {
    const flagElement = document.getElementById(uniqueID)
    const { offsetTop, offsetLeft, offsetHeight } = anchorElement
    let dividerSize = 0.80
    if (offsetHeight > 30) {
      dividerSize = 0.5
    }
    const heightOfFlag = offsetHeight * dividerSize
    const widthOfFlag = flagElement.offsetWidth + ((offsetHeight - heightOfFlag) / 2)

    flagElement.style.top = `${offsetTop + (offsetHeight - heightOfFlag) / 2}px`
    flagElement.style.left = `${offsetLeft + ((offsetHeight - heightOfFlag) / 2)}px`
    flagElement.querySelector('.endereco-flag').style.width = `${heightOfFlag}px`
    flagElement.querySelector('.endereco-flag').style.height = `${heightOfFlag}px`
    anchorElement.style.paddingLeft = `${widthOfFlag}px`
  }
}

export default FlagHandler

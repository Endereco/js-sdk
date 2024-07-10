import ConfigService from './ConfigService'
import FilterService from './FilterService'

class DOMService {
  constructor (configService, filterService) {
    if (!(configService instanceof ConfigService)) {
      throw new TypeError('Invalid configService: Must be an instance of ConfigService')
    }
    if (!(filterService instanceof FilterService)) {
      throw new TypeError('Invalid filterService: Must be an instance of FilterService')
    }
    this.configService = configService
    this.filterService = filterService
  }

  addBodyClass () {
    if (this.themeName) {
      document.querySelector('body').classList.add('endereco-theme--' + this.themeName)
    } else {
      document.querySelector('body').classList.add('endereco-theme--current-theme')
    }
  }

  addCss () {
    const config = this.configService.getConfig('integrator')

    // Clean up beforehand (just in case)
    const stylesDOM = document.getElementById('#endereco-styles-include')
    if (stylesDOM) {
      stylesDOM.remove()
    }

    // const cssLink = this.config.ux.cssFilePath || 'data:text/css;charset=UTF-8,' + encodeURIComponent(this.css);
    const cssLink = 'data:text/css;charset=UTF-8,' + encodeURIComponent(config.cssCompiled)
    const head = document.querySelector('head')
    const linkElement = document.createElement('link')
    linkElement.setAttribute('id', 'endereco-styles-include')
    linkElement.setAttribute('rel', 'stylesheet')
    linkElement.setAttribute('type', 'text/css')
    linkElement.setAttribute('href', cssLink)
    head.appendChild(linkElement)
  }
}

export default DOMService

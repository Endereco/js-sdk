import BaseManager from '../BaseManager'
import RuleInterface from './RuleInterface'

class HasAccountableSession extends RuleInterface {
  evaluate (manager) {
    if (!(manager instanceof BaseManager)) {
      throw new TypeError('Invalid manager: Must be an instance of BaseManager')
    }

    let isAccountable = false

    if (manager.session.sessionId && (manager.session.sessionCounter > 0)) {
      isAccountable = true
    }

    console.log(this.constructor.name + ' Evaluation', isAccountable)

    return isAccountable
  }
}

export default HasAccountableSession

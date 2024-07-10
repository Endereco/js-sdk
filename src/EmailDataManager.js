import DoAccounting from './actions/DoAccounting'
import ValidateDataAction from './actions/ValidateData'
import DataSignatureInvalid from './rules/DataSignatureInvalid'
import HasAccountableSession from './rules/HasAccountableSession'
import DataManager from './DataManager'

class EmailDataManager extends DataManager {
  constructor (configService, filterService, apiService, cryptoService, modalManager, formManager, statusService) {
    super(configService, filterService, apiService, cryptoService, modalManager, formManager, statusService)

    this.data = {
      email: ''
    }

    this.meta = {
      type: 'email',
      status: [],
      predictions: [],
      hash: ''
    }

    this.initRoutine()
  }

  addRulesActions () {
    this.addRegularRuleAndAction(
      new DataSignatureInvalid(),
      new ValidateDataAction()
    )
    this.addFinalRuleAndAction(
      new HasAccountableSession(),
      new DoAccounting()
    )
  }

  async validateData (data = null) {
    if (!data) {
      data = this.filterOutWritableFields(this.data)
    }
    this.setIntent('review')
    return this.apiService.checkEmail(data, this.session)
  }
}

export default EmailDataManager

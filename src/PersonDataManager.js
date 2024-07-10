import DoAccounting from './actions/DoAccounting'
import ValidateDataAction from './actions/ValidateData'
import DataSignatureInvalid from './rules/DataSignatureInvalid'
import HasAccountableSession from './rules/HasAccountableSession'
import DataManager from './DataManager'
import SelectPersonPredictionAutomatically from './actions/SelectPersonPredictionAutomatically'
import NameNeedsCorrection from './rules/NameNeedsCorrection'

class PersonDataManager extends DataManager {
  constructor (configService, filterService, apiService, cryptoService, modalManager, formManager, statusService) {
    super(configService, filterService, apiService, cryptoService, modalManager, formManager, statusService)

    this.data = {
      salutation: '',
      title: '',
      firstName: '',
      lastName: ''
    }

    this.meta = {
      type: 'person',
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
    this.addRegularRuleAndAction(
      new NameNeedsCorrection(),
      new SelectPersonPredictionAutomatically()
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
    return this.apiService.checkPerson(data, this.session)
  }
}

export default PersonDataManager

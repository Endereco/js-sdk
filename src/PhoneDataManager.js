import DoAccounting from './actions/DoAccounting'
import ValidateDataAction from './actions/ValidateData'
import DataSignatureInvalid from './rules/DataSignatureInvalid'
import HasAccountableSession from './rules/HasAccountableSession'
import DataManager from './DataManager'
import PhoneFormatNeedsCorrection from './rules/PhoneFormatNeedsCorrection'
import SelectFormattedPhoneAutomatically from './actions/SelectFormattedPhoneAutomatically'
import PhoneInWrongFieldType from './rules/PhoneInWrongFieldType'
import DisplayWrongPhoneTypeError from './actions/DisplayWrongPhoneTypeError'

class PhoneDataManager extends DataManager {
  constructor (configService, filterService, apiService, cryptoService, modalManager, formManager, statusService) {
    super(configService, filterService, apiService, cryptoService, modalManager, formManager, statusService)

    this.data = {
      phone: '',
      countryCode: ''
    }

    this.meta = {
      type: 'phone',
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
      new PhoneFormatNeedsCorrection(),
      new SelectFormattedPhoneAutomatically()
    )
    this.addRegularRuleAndAction(
      new PhoneInWrongFieldType(),
      new DisplayWrongPhoneTypeError()
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

    if (!this.isValidationMeaningfull(data)) {
      return;
    }
    
    this.setIntent('review')
    return this.apiService.checkPhone(data, this.other, this.session)
  }

  isValidationMeaningfull(data) {
    const isPhoneNotEmpty = data.phone.trim() !== ''
    return isPhoneNotEmpty;
  }

  displayPhoneFlag () {
    this.formManager.displayPhoneFlag()
  }

  afterValueInputRoutine () {
    this.displayPhoneFlag()
  }

  afterValueChangeRoutine () {
    this.displayPhoneFlag()
  }
}

export default PhoneDataManager

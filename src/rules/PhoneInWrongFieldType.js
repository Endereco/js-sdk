import PhoneDataManager from '../PhoneDataManager'
import RuleInterface from './RuleInterface'

class PhoneInWrongFieldType extends RuleInterface {
  evaluate (manager) {
    if (!(manager instanceof PhoneDataManager)) {
      throw new TypeError('Invalid manager: Must be an instance of PhoneDataManager')
    }
    const { meta, other } = manager

    const isMobilePhone = meta.status.includes('phone_is_mobile')
    const isFixedLine = meta.status.includes('phone_is_fixed_line')
    const phoneDataType = other.dataType;

    const isViolated = (phoneDataType !== '') && 
      (
        (isMobilePhone && (phoneDataType != 'mobile')) || 
        (isFixedLine && (phoneDataType != 'fixedLine'))
      )

    console.log(this.constructor.name + ' Evaluation', phoneDataType, isFixedLine, isMobilePhone, isViolated)

    return isViolated
  }
}

export default PhoneInWrongFieldType

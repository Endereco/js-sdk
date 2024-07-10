import ActionInterface from './ActionInterface'

class DisplayWrongPhoneTypeError extends ActionInterface {
  async execute (manager) {
    const isMobilePhone = manager.meta.status.includes('phone_is_mobile')
    const isFixedLine = manager.meta.status.includes('phone_is_fixed_line')
    const phoneDataType = manager.other.dataType;

    manager.meta.status = ['phone_invalid', 'phone_wrong_type']
    if (isMobilePhone && (phoneDataType == 'fixedLine')) {
      manager.meta.status.push('phone_expected_type_fixed_line')
    } else if (isFixedLine && (phoneDataType == 'mobile')) {
      manager.meta.status.push('phone_expected_type_mobile')
    }

    manager.displayStatus()
    manager.displayErrorMessages()
    manager.syncMeta()

    return true
  }
}

export default DisplayWrongPhoneTypeError

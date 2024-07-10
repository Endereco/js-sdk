import InterceptorInterface from './InterceptorInterface'

class KeyDownEnterInterceptor extends InterceptorInterface {
  intercept (form) {
    form.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !this.coordinator.interceptionTriggered) {
        this.coordinator.interceptionTriggered = true

        event.preventDefault()
        this.coordinator.saveTrigger('keyDownEnter', { form, event })
        this.coordinator.submit()
      }
    })

    const submitButton = form.querySelector('[type="submit"]')
    if (submitButton) {
      submitButton.addEventListener('click', (event) => {
        if (this.coordinator.interceptionTriggered) return
        this.coordinator.interceptionTriggered = true

        event.preventDefault()
        this.coordinator.saveTrigger('buttonClick', { form, event })
        this.coordinator.submit()
      })
    }
  }
}

export default KeyDownEnterInterceptor

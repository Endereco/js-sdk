import InterceptorInterface from './InterceptorInterface'

class SubmitEventInterceptor extends InterceptorInterface {
  intercept (form) {
    form.addEventListener('submit', (event) => {
      if (this.coordinator.interceptionTriggered) return
      this.coordinator.interceptionTriggered = true

      event.preventDefault()
      this.coordinator.saveTrigger('submitEvent', { form, event })
      this.coordinator.submit()
    })
  }
}

export default SubmitEventInterceptor

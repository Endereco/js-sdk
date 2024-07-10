import InterceptorInterface from './InterceptorInterface'

class OverwriteSubmitInterceptor extends InterceptorInterface {
  intercept (form) {
    const originalSubmit = form.submit.bind(form)
    form.submit = () => {
      if (this.coordinator.interceptionTriggered) return
      this.coordinator.interceptionTriggered = true

      this.coordinator.saveTrigger('overwriteSubmit', { form, originalSubmit })
      this.coordinator.submit()
    }
  }
}

export default OverwriteSubmitInterceptor

import SubmitEventInterceptor from './interceptors/SubmitEventInterceptor'
import OverwriteSubmitInterceptor from './interceptors/OverwriteSubmitInterceptor'
import KeyDownEnterInterceptor from './interceptors/KeyDownEnterInterceptor'
import BaseManager from './BaseManager'
import ConfigService from './ConfigService'

class SubmissionCoordinator {
  observedForms = []
  interceptionTriggered = false
  submitTrigger = null

  constructor (configService) {
    if (!(configService instanceof ConfigService)) {
      throw new TypeError('Invalid configService: Must be an instance of ConfigService')
    }
    this.configService = configService
    this.subscribers = []
    this.interceptors = [
      new KeyDownEnterInterceptor(this),
      new SubmitEventInterceptor(this),
      new OverwriteSubmitInterceptor(this)
    ]
  }

  /**
   * Watches one or multiple forms for submission events.
   * @param {HTMLFormElement|HTMLFormElement[]} forms - The form(s) to observe for submission.
   */
  watch (forms) {
    if (Array.isArray(forms)) {
      forms.forEach(form => this.watchForm(form))
    } else {
      this.watchForm(forms)
    }
  }

  /**
   * Adds a subscriber to the list.
   * @param {BaseManager} subscriber - The subscriber to add.
   * @throws Will throw an error if the subscriber does not implement BaseManager.
   */
  addSubscriber (subscriber) {
    if (subscriber instanceof BaseManager) {
      this.subscribers.push(subscriber)
    } else {
      throw new Error('Subscriber must implement BaseManager')
    }
  }

  /**
   * Triggers the submission process if there are no pending actions.
   */
  async submit () {
    this.subscribers.forEach(subscriber => {
      subscriber.setIntent('review')
    })

    try {
      await this.handleRegularPendingActions()
      await this.handleFinalPendingActions()
      this.retriggerSubmit()
    } catch (error) {
      console.log('Caught error', error)
      this.interceptionTriggered = false
    }
  }

  /**
   * Saves the trigger details for submission.
   * @param {string} triggerType - The type of the submit trigger.
   * @param {object} details - The details of the submit trigger.
   */
  saveTrigger (triggerType, details) {
    this.submitTrigger = { triggerType, details }
  }

  /**
   * Retriggers the form submission based on the saved trigger.
   */
  retriggerSubmit () {
    if (!this.submitTrigger) return

    const { triggerType, details } = this.submitTrigger
    try {
      switch (triggerType) {
        case 'submitEvent':
          details.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
          break
        case 'overwriteSubmit':
          details.originalSubmit()
          break
        case 'keyDownEnter':
          // Simulate Enter keydown event or click event on submit button
          details.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
          break
        case 'buttonClick': {
          const button = details.form.querySelector('[type="submit"]')
          if (button) {
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
            button.dispatchEvent(clickEvent)
          } else {
            console.error('No submit button found in form:', details.form)
          }
          break
        }
      }
    } catch (error) {
      console.error('Error retriggering submit:', error)
    } finally {
      this.submitTrigger = null // Reset trigger after use
    }
  }

  /**
   * Adds a single form to the observed forms list and adds interceptors.
   * @param {HTMLFormElement} form - The form to add.
   */
  watchForm (form) {
    if (!this.observedForms.includes(form)) {
      this.observedForms.push(form)
      this.addInterceptors(form)
    }
  }

  /**
   * Adds all interceptors to a given form.
   * @param {HTMLFormElement} form - The form to add interceptors to.
   */
  addInterceptors (form) {
    this.interceptors.forEach(interceptor => interceptor.intercept(form))
  }

  /**
   * Handles regular pending actions from subscribers.
   * @returns {Promise<void>}
   */
  async handleRegularPendingActions () {
    const pendingRegularPromises = this.subscribers
      .filter(subscriber => subscriber.hasRegularPendingActions())
      .map(subscriber => subscriber.finishRegularPendingActions())

    if (pendingRegularPromises.length > 0) {
      await Promise.all(pendingRegularPromises)
    }
  }

  /**
   * Handles final pending actions from subscribers.
   * @returns {Promise<void>}
   */
  async handleFinalPendingActions () {
    const pendingFinalPromises = this.subscribers
      .filter(subscriber => subscriber.hasFinalPendingActions())
      .map(subscriber => subscriber.finishFinalPendingActions())

    if (pendingFinalPromises.length > 0) {
      await Promise.all(pendingFinalPromises)
    }
  }
}

export default SubmissionCoordinator

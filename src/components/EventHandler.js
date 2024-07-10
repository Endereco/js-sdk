/**
 * EventHandler manages event listeners and emits events with optional delay and batching.
 * It provides a centralized way to handle various form-related events.
 */
class EventHandler {
  /** @type {string} Event type for blur events */
  static EVENT_BLUR = 'blur'

  /** @type {string} Event type for value change events */
  static EVENT_CHANGE = 'valueChange'

  /** @type {string} Event type for input events */
  static EVENT_INPUT = 'valueInput'

  /** @type {string} Event type for initial read events */
  static EVENT_INITIAL_READ = 'initialRead'

  /**
   * Creates an instance of EventHandler.
   * @param formManager
   */
  constructor (formManager) {
    this.formManager = formManager

    /** @type {{[key: string]: Function[]}} */
    this.listeners = {}

    /** @type {boolean} */
    this.isProcessing = false

    /** @type {{[key: string]: number}} */
    this.delayedEmit = {}
  }

  /**
   * Adds an event listener for a specific event type.
   * @param {string} eventName - The name of the event to listen for.
   * @param {Function} callback - The function to call when the event is emitted.
   */
  on (eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = []
    }
    this.listeners[eventName].push(callback)
  }

  /**
   * Removes an event listener for a specific event type.
   * @param {string} eventName - The name of the event to remove the listener from.
   * @param {Function} callback - The function to remove from the listeners.
   */
  off (eventName, callback) {
    if (!this.listeners[eventName]) return
    this.listeners[eventName] = this.listeners[eventName].filter(
      listener => listener !== callback
    )
  }

  /**
   * Emits an event immediately or schedules it if another event is being processed.
   * @param {string} eventName - The name of the event to emit.
   * @param {*} data - The data to pass to the event listeners.
   * @param {Function} [afterNotification] - A function to call after all listeners have been notified.
   */
  emit (eventName, data, afterNotification = null) {
    if (!this.listeners[eventName]) return
    if (this.isProcessing) {
      setTimeout(() => {
        this.emit(eventName, data, afterNotification)
      }, 10)
    } else {
      this.listeners[eventName].forEach(callback => callback(data))
      if (afterNotification) {
        afterNotification(data)
      }
    }
  }

  /**
   * Enqueues an event to be emitted after a short delay, batching multiple calls.
   * @param {string} eventName - The name of the event to emit.
   * @param {*} data - The data to pass to the event listeners.
   * @param {Function} [afterNotification] - A function to call after all listeners have been notified.
   */
  enqueueEmit (eventName, data, afterNotification) {
    console.log("Call enqueueEmit", eventName, data)
    if (!this.listeners[eventName]) return
    this.isProcessing = true
    if (this.delayedEmit[eventName]) {
      clearTimeout(this.delayedEmit[eventName])
    }
    this.delayedEmit[eventName] = setTimeout(() => {
      this.listeners[eventName].forEach(callback => callback(data))
      if (afterNotification) {
        afterNotification(data)
      }
      this.isProcessing = false
    }, 20)
  }
}

export default EventHandler

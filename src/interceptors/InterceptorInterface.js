class InterceptorInterface {
  constructor (coordinator) {
    if (new.target === InterceptorInterface) {
      throw new TypeError('Cannot construct InterceptorInterface instances directly')
    }
    if (typeof this.intercept !== 'function') {
      throw new TypeError("Must override method 'intercept'")
    }
    this.coordinator = coordinator
  }

  intercept (form) {
    throw new Error("Method 'intercept()' must be implemented.")
  }
}

export default InterceptorInterface

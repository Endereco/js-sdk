class RuleInterface {
  constructor () {
    if (new.target === RuleInterface) {
      throw new TypeError('Cannot construct RuleInterface instances directly')
    }
  }

  evaluate (manager) {
    throw new Error("Method 'evaluate()' must be implemented.")
  }
}

export default RuleInterface

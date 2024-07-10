import ActionInterface from './actions/ActionInterface'
import RuleInterface from './rules/RuleInterface'
import { v4 as uuidv4 } from 'uuid'

class BaseManager {
  constructor () {
    this.regularRules = []
    this.finalRules = []
    this.regularRuleActionMap = new Map()
    this.finalRuleActionMap = new Map()
    this.intent = 'review'
    this.name = ''
  }

  setIntent (intent) {
    this.intent = intent
  }

  generateSessionId () {
    return uuidv4()
  }

  resetSession () {
    this.session.sessionId = this.generateSessionId()
    this.session.sessionCounter = 0
  }

  /**
   * Adds a rule to the manager.
   * @param {RuleInterface} rule - The rule to be added.
   */
  addRegularRule (rule) {
    this.#validateRule(rule)
    this.regularRules.push(rule)
  }

  addFinalRule (rule) {
    this.#validateRule(rule)
    this.finalRules.push(rule)
  }

  /**
   * Adds a rule and its corresponding action strategy.
   * @param {RuleInterface} rule - The rule to be added.
   * @param {ActionInterface} actionStrategy - The action strategy to be associated with the rule.
   */
  addRegularRuleAndAction (rule, actionStrategy) {
    this.#validateRule(rule)
    this.#validateActionStrategy(actionStrategy)
    this.addRegularRule(rule)
    this.regularRuleActionMap.set(rule, actionStrategy)
  }

  addFinalRuleAndAction (rule, actionStrategy) {
    this.#validateRule(rule)
    this.#validateActionStrategy(actionStrategy)
    this.addFinalRule(rule)
    this.finalRuleActionMap.set(rule, actionStrategy)
  }

  /**
   * Checks if there are any pending actions based on the rules.
   * @returns {boolean} - True if there are pending actions, false otherwise.
   */
  hasRegularPendingActions () {
    return this.regularRules.some(currentRule => currentRule.evaluate(this))
  }

  hasFinalPendingActions () {
    return this.finalRules.some(currentRule => currentRule.evaluate(this))
  }

  executeCurrentPendingActions (rules, actionMap) {
    const pendingPromises = []
    for (const currentRule of rules) {
      if (currentRule.evaluate(this)) {
        const actionStrategy = actionMap.get(currentRule)
        if (actionStrategy) {
          pendingPromises.push(
            actionStrategy.execute(this).catch(error => {
              // console.error(`Error executing action strategy for rule ${currentRule}:`, error)
              return Promise.reject(error)
            })
          )
        }
      }
    }

    return Promise.all(pendingPromises)
  }

  /**
   * Executes all pending actions and returns a promise.
   * Continues to evaluate and execute actions until no more actions are pending.
   * @param rules
   * @param actionMap
   * @returns {Promise} - A promise that resolves when all actions are completed.
   */
  async finishPendingActions (rules, actionMap) {
    return this.executeCurrentPendingActions(rules, actionMap).then(results => {
      if (results.length > 0) {
        // If there were pending actions, re-evaluate and execute again.
        return this.finishPendingActions(rules, actionMap)
      } else {
        // No more actions to execute.
        return Promise.resolve()
      }
    }).catch(error => {
      // Propagate the error to the caller
      console.log('Caught error', error)
      return Promise.reject(error)
    })
  }

  async finishRegularPendingActions () {
    const rules = this.regularRules
    const actionMap = this.regularRuleActionMap
    return this.finishPendingActions(rules, actionMap)
  }

  async finishFinalPendingActions () {
    const rules = this.finalRules
    const actionMap = this.finalRuleActionMap
    return this.finishPendingActions(rules, actionMap)
  }

  #validateRule (rule) {
    if (!(rule instanceof RuleInterface)) {
      throw new Error('Invalid rule: Must be an instance of RuleInterface')
    }
  }

  #validateActionStrategy (actionStrategy) {
    if (!(actionStrategy instanceof ActionInterface)) {
      throw new Error('Invalid strategy: Must be an instance of ActionInterface')
    }
  }
}

export default BaseManager

import ActionInterface from './ActionInterface'

class ValidateData extends ActionInterface {
  counter = 0
  async execute (dataManager) {
    this.counter++
    if (this.counter > 5) {
      throw new Error("Something went wrong")
    }
    await dataManager.executeValidationRoutine().catch(e => {
      // We can implement different strategies here, like retry or logging
      console.log('Caught error', e)
    })
  }
}

export default ValidateData

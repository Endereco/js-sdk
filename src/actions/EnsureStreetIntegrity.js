import ActionInterface from './ActionInterface'

class EnsureStreetIntegrity extends ActionInterface {
  async execute (addressManager) {
    await addressManager.ensureStreetIntegrity()
  }
}

export default EnsureStreetIntegrity

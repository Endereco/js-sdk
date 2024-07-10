class ActionInterface {
  execute (manager) {
    throw new Error('This method should be overridden by concrete strategies')
  }
}

export default ActionInterface

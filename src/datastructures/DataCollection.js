class DataCollection {
  constructor (data = []) {
    this.data = data
    this.isValid = true
  }

  get items () {
    return this.data
  }

  set items (newData) {
    this.data = newData
    this.isValid = true
  }

  get length () {
    return this.data.length
  }

  getItem (index) {
    return this.data[index]
  }

  map (callback) {
    return this.data.map(callback)
  }

  filter (callback) {
    return this.data.filter(callback)
  }

  find (callback) {
    return this.data.find(callback)
  }

  forEach (callback) {
    this.data.forEach(callback)
  }

  invalidate () {
    this.isValid = false
  }

  validate () {
    this.isValid = true
  }
}

export default DataCollection

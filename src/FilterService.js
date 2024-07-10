class FilterService {
  constructor () {
    this.filters = {
      'ConfigService.getConfig': []
    }
  }

  filter (filterName, data, context) {
    let filterableData = data
    if (this.filters[filterName] && this.filters[filterName].length !== 0) {
      this.filters[filterName].forEach(filter => {
        filterableData = filter(filterableData, context)
      })
    }
    return filterableData
  }
}

export default FilterService

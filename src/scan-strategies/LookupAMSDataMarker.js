import DataMarkerLookup from "./DataMarkerLookup"

class LookupAMSDataMarker extends DataMarkerLookup {
  DATA_MARKER_SELECTOR = '[name="endereco_data_marker"][data-endereco-service="ams"][data-has-object="no"]'

  execute(integrator) {
    document.querySelectorAll(this.DATA_MARKER_SELECTOR).forEach(DOMElement => {
      const selectors = this.getSelectors(DOMElement)
      const options = this.getOptions(DOMElement)
      integrator.initAMS(selectors, options)
      this.markAsProcessed(DOMElement)
    })
  }
}

export default LookupAMSDataMarker
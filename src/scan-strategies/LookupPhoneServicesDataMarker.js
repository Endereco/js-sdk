import DataMarkerLookup from "./DataMarkerLookup"

class LookupPhoneServicesDataMarker extends DataMarkerLookup {
  DATA_MARKER_SELECTOR = '[name="endereco_data_marker"][data-endereco-service="phoneService"][data-has-object="no"]'

  execute(integrator) {
    document.querySelectorAll(this.DATA_MARKER_SELECTOR).forEach(DOMElement => {
      const selectors = this.getSelectors(DOMElement)
      const options = this.getOptions(DOMElement)
      integrator.initPhoneServices(selectors, options)
      this.markAsProcessed(DOMElement)
    })
  }
}

export default LookupPhoneServicesDataMarker
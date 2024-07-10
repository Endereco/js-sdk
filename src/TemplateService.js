import addressSelectionModalTemplate from './templates/address_selection_modal.mustache'
import addressReviewModalTemplate from './templates/address_review_modal.mustache'
import additionalInfoTemplate from './templates/addresslines/additional_info_addressline.mustache'
import defaultStreetTemplate from './templates/addresslines/street_addressline.mustache'
import reverseStreetTemplate from './templates/addresslines/street_reversed_addressline.mustache'
import localityTemplate from './templates/addresslines/locality_addressline.mustache'
import underfieldErrorList from './templates/underfield_errorlist.mustache'
import phoneFlagTemplate from './templates/phone_flag.mustache'
import phoneCodeDropdownTemplate from './templates/phone_code_dropdown.mustache'
import postalCodeAutocompleteTemplate from './templates/postal_code_predictions.mustache'
import localityAutocompleteTemplate from './templates/locality_predictions.mustache'
import streetFullAutocompleteTemplate from './templates/street_full_predictions.mustache'
import streetNameAutocompleteTemplate from './templates/street_name_predictions.mustache'
import ConfigService from './ConfigService'
import FilterService from './FilterService'

// Define constants for address keys
const ADDRESS_KEYS = [
  'additionalInfo',
  'streetFull',
  'streetName',
  'buildingNumber',
  'postalCode',
  'locality',
  'subdivisionCode',
  'countryCode'
]

// Templates for different address components
const ADDRESSLINE_TEMPLATES = {
  additionalInfo: additionalInfoTemplate,
  streetFull: defaultStreetTemplate,
  streetName: defaultStreetTemplate,
  buildingNumber: defaultStreetTemplate,
  postalCode: localityTemplate,
  locality: localityTemplate
}

const AUTOCOMPLETE_DROPDOWN_TEMPLATE_MAP = {
  postalCode: postalCodeAutocompleteTemplate,
  locality: localityAutocompleteTemplate,
  streetFull: streetFullAutocompleteTemplate,
  streetName: streetNameAutocompleteTemplate
}

// Country-specific street templates
const COUNTRY_STREET_TEMPLATES = {
  default: defaultStreetTemplate,
  fr: reverseStreetTemplate,
  us: reverseStreetTemplate,
  dz: reverseStreetTemplate,
  ad: reverseStreetTemplate,
  az: reverseStreetTemplate,
  am: reverseStreetTemplate,
  au: reverseStreetTemplate,
  bh: reverseStreetTemplate,
  bd: reverseStreetTemplate,
  bn: reverseStreetTemplate,
  kh: reverseStreetTemplate,
  ca: reverseStreetTemplate,
  cn: reverseStreetTemplate,
  cx: reverseStreetTemplate,
  cc: reverseStreetTemplate,
  cd: reverseStreetTemplate,
  cg: reverseStreetTemplate,
  ck: reverseStreetTemplate,
  cy: reverseStreetTemplate,
  ci: reverseStreetTemplate,
  dm: reverseStreetTemplate,
  eg: reverseStreetTemplate,
  fj: reverseStreetTemplate,
  ga: reverseStreetTemplate,
  gm: reverseStreetTemplate,
  ge: reverseStreetTemplate,
  gh: reverseStreetTemplate,
  gi: reverseStreetTemplate,
  gp: reverseStreetTemplate,
  gu: reverseStreetTemplate,
  gy: reverseStreetTemplate,
  hk: reverseStreetTemplate,
  in: reverseStreetTemplate,
  id: reverseStreetTemplate,
  ie: reverseStreetTemplate,
  gb: reverseStreetTemplate,
  il: reverseStreetTemplate,
  la: reverseStreetTemplate,
  lb: reverseStreetTemplate,
  lu: reverseStreetTemplate,
  mr: reverseStreetTemplate,
  mu: reverseStreetTemplate,
  mc: reverseStreetTemplate,
  ms: reverseStreetTemplate,
  ma: reverseStreetTemplate,
  mm: reverseStreetTemplate,
  na: reverseStreetTemplate,
  nz: reverseStreetTemplate,
  ng: reverseStreetTemplate,
  nf: reverseStreetTemplate,
  om: reverseStreetTemplate,
  pk: reverseStreetTemplate,
  pw: reverseStreetTemplate,
  ph: reverseStreetTemplate,
  pr: reverseStreetTemplate,
  rw: reverseStreetTemplate,
  re: reverseStreetTemplate,
  bl: reverseStreetTemplate,
  sh: reverseStreetTemplate,
  kn: reverseStreetTemplate,
  mf: reverseStreetTemplate,
  sa: reverseStreetTemplate,
  sn: reverseStreetTemplate,
  sl: reverseStreetTemplate,
  sg: reverseStreetTemplate,
  tw: reverseStreetTemplate,
  tz: reverseStreetTemplate,
  th: reverseStreetTemplate,
  tg: reverseStreetTemplate,
  tt: reverseStreetTemplate,
  tn: reverseStreetTemplate,
  tm: reverseStreetTemplate,
  tc: reverseStreetTemplate,
  vm: reverseStreetTemplate,
  wf: reverseStreetTemplate,
  ye: reverseStreetTemplate,
  zm: reverseStreetTemplate,
  zw: reverseStreetTemplate
}

const MODAL_TEMPLATES = {
  addressSelectionModal: addressSelectionModalTemplate,
  addressReviewModal: addressReviewModalTemplate
}

class TemplateService {
  constructor (configService, filterService) {
    if (!(configService instanceof ConfigService)) {
      throw new TypeError('Invalid configService: Must be an instance of ConfigService')
    }
    if (!(filterService instanceof FilterService)) {
      throw new TypeError('Invalid filterService: Must be an instance of FilterService')
    }
    this.configService = configService
    this.filterService = filterService
  }

  getTemplate (templateName) {
    return MODAL_TEMPLATES[templateName] || ''
  }

  getErrorListTemplate () {
    return underfieldErrorList || ''
  }

  getPhoneFlagTemplate () {
    return phoneFlagTemplate
  }

  getPhoneCodeDropdownTemplate () {
    return phoneCodeDropdownTemplate
  }

  getAutocompleteDropdownTemplate (fieldName) {
    return AUTOCOMPLETE_DROPDOWN_TEMPLATE_MAP[fieldName] || ''
  }

  getAddressLineTemplates (address) {
    const addressLineTemplates = []
    const usedTemplates = new Set()

    ADDRESS_KEYS.forEach(key => {
      if (!Object.hasOwn(address, key)) {
        return
      }
      const template = this.getAddressLineTemplate(key, address)
      if (template && !usedTemplates.has(template)) {
        addressLineTemplates.push(template)
        usedTemplates.add(template)
      }
    })

    return addressLineTemplates
  }

  getAddressLineTemplate (key, address) {
    if (key === 'streetFull' || key === 'streetName' || key === 'buildingNumber') {
      return this.getCountrySpecificStreetTemplate(address.countryCode)
    }

    return ADDRESSLINE_TEMPLATES[key] || ''
  }

  getCountrySpecificStreetTemplate (countryCode) {
    return COUNTRY_STREET_TEMPLATES[countryCode.trim().toLowerCase()] || COUNTRY_STREET_TEMPLATES.default
  }

  createStatusWrapper (html, statuses) {
    const statusClasses = statuses && statuses.length > 0 ? statuses.map(status => `endereco-status__${status}`).join(' ') : 'endereco-status__empty'
    return `<div class="${statusClasses}">${html}</div>`
  }
}

export default TemplateService

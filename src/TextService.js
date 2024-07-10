import ConfigService from './ConfigService'
import FilterService from './FilterService'

class TextService {
  constructor (configService, filterService) {
    if (!(configService instanceof ConfigService)) {
      throw new TypeError('Invalid configService: Must be an instance of ConfigService')
    }
    if (!(filterService instanceof FilterService)) {
      throw new TypeError('Invalid configService: Must be an instance of FilterService')
    }
    this.configService = configService
    this.filterService = filterService
    this.texts = {
      modals: {
        addressSelectionModalTitle: 'Adresse prüfen',
        addressSelectionModalTitleBilling: 'Rechnungsadresse prüfen',
        addressSelectionModalTitleShipping: 'Lieferadresse prüfen',
        addressSelectionModalSubtitle: 'Die von Ihnen eingegebene Adresse scheint nicht korrekt oder unvollständig zu sein. Bitte wählen Sie die korrekte Adresse aus.',
        predictionSection: 'Unsere Vorschläge',
        originalInputSection: 'Ihre Eingabe',
        editInputLink: 'bearbeiten',
        warningText: 'Falsche Adressen können zu Problemen in der Zustellung führen und weitere Kosten verursachen.',
        confirmCheckboxText: 'Ich bestätige, dass meine Adresse korrekt und zustellbar ist.',
        selectButton: 'Auswahl übernehmen',
        confirmButton: 'Auswahl bestätigen',
        editButton: 'Adresse bearbeiten'
      },
      errors: {
        'address.address_needs_correction': 'Die von Ihnen eingegebene Adresse scheint nicht korrekt oder unvollständig zu sein. Bitte korrigieren Sie diese.',
        'address.address_multiple_variants': 'Für die von Ihnen eingegebene Adresse gibt es mehrere Korrektur-Varianten. Bitte wählen Sie eine aus.',
        'address.address_not_found': 'Die Adresse konnte nicht gefunden werden. Prüfen Sie bitte die Schreibweise der Adresse.',
        'address.address_of_not_supported_type': 'Die Adresse ist von einem nicht unterstützten Typ (z.B. Postfiliale, Packstation).',
        'address.country_code_needs_correction': 'Der Ländercode ist falsch und muss korrigiert werden.',
        'address.subdivision_code_needs_correction': 'Die Region ist falsch und muss korrigiert werden.',
        'address.postal_code_needs_correction': 'Die Postleitzahl ist falsch und muss korrigiert werden.',
        'address.locality_needs_correction': 'Der Ortsname ist falsch und muss korrigiert werden.',
        'address.street_full_needs_correction': 'Die Straße (inkl. Hausnummer) ist falsch und muss korrigiert werden.',
        'address.street_name_needs_correction': 'Die Schreibweise der Straße ist fehlerhaft.',
        'address.building_number_needs_correction': 'Die Hausnummer ist falsch und muss korrigiert werden.',
        'address.building_number_not_found': 'Die Hausnummer wurde in der angegebenen Straße und PLZ nicht gefunden.',
        'address.building_number_is_missing': 'Keine Hausnummer enthalten.',
        'address.additional_info_needs_correction': 'Die Zusatzinformationen sind falsch und müssen korrigiert werden.',
        'packstation.additional_info_needs_correction': 'Die Postnummer ist falsch und muss korrigiert werden.',
        'person.name_needs_correction': 'Der von Ihnen eingegebene Name scheint nicht korrekt zu sein. Bitte korrigieren Sie ihn.',
        'person.name_not_found': 'Der von Ihnen eingegebene Name scheint nicht korrekt zu sein. Bitte korrigieren Sie ihn.',
        'email.email_not_correct': 'Die von Ihnen eingegebene E-Mail-Adresse ist nicht korrekt.',
        'email.email_no_mx': 'Die angegebene E-Mail-Adresse scheint ungültig zu sein. Bitte überprüfen Sie die Schreibweise, insbesondere den Teil nach dem @-Zeichen.',
        'email.email_mailbox_does_not_exist': 'Das angegebene E-Mail-Postfach existiert nicht. Bitte überprüfen Sie, ob Sie sich bei der Eingabe vertippt haben.',
        'phone.phone_invalid': 'Die eingegebene Telefonnummer ist ungültig.',
        'phone.phone_needs_correction': 'Die von Ihnen eingegebene Telefonnummer muss korrigiert werden.',
        'phone.phone_hlr_lookup_failed': 'Die eingegebene Telefonnummer scheint nicht aktiv zu sein.',
        'phone.phone_format_needs_correction': 'Die eingegebene Telefonnummer ist falsch formatiert.',
        'phone.phone_expected_type_mobile': 'Es muss eine mobile Telefonnummer sein.',
        'phone.phone_expected_type_fixed_line': 'Es muss eine Festnetz Telefonnummer sein.',
      },
      success: {
        'address.address_correct': 'Die von Ihnen eingegebene Adresse ist korrekt.',
        'address.country_code_correct': 'Der Ländercode ist korrekt.',
        'address.subdivision_code_correct': 'Die Region ist korrekt.',
        'address.postal_code_correct': 'Die Postleitzahl ist korrekt.',
        'address.locality_correct': 'Der Ortsname ist korrekt.',
        'address.street_full_correct': 'Die Straße (inkl. Hausnummer) ist korrekt.',
        'address.street_name_correct': 'Die Schreibweise der Straße ist korrekt.',
        'address.building_number_correct': 'Die Hausnummer ist korrekt.',
        'address.additional_info_correct': 'Die Zusatzinformationen sind korrekt.',
        'packstation.additional_info_correct': 'Die Postnummer ist korrekt.',
        'person.name_correct': 'Der von Ihnen eingegebene Name ist korrekt.',
        'email.email_correct': 'Die von Ihnen eingegebene E-Mail-Adresse ist korrekt.',
        'phone.phone_correct': 'Die von Ihnen eingegebene Telefonnummer ist korrekt.'
      },
      info: {
        'address.address_minor_correction': 'Es gibt eine kleine Korrektur, die automatisch übernommen werden kann.',
        'address.address_major_correction': 'Es gibt eine größere Korrektur, die manuell bestätigt werden muss.'
      }
    }
  }

  /**
   * Gets the texts for a specific category.
   * @param {string} category - The category of texts to retrieve.
   * @returns {object} The texts for the specified category.
   */
  getTexts (category) {
    return this.texts[category] || {}
  }

  getErrorMessage (key) {
    return this.texts.errors[key] || null
  }

  getSuccessMessage (key) {
    return this.texts.success[key] || null
  }
}
export default TextService

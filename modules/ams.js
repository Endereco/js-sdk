import merge from 'lodash.merge';
import EnderecoBase from './components/base.js'

// Extensions.
import CountryCodeExtension from './extensions/fields/CountryCodeExtension.js';
import CountryCodeCheckExtension from './extensions/checks/CountryCodeCheckExtension.js';
import SubdivisionCodeExtension from "./extensions/fields/SubdivisionCodeExtension";
import SubdivisionCodeCheckExtension from "./extensions/checks/SubdivisionCodeCheckExtension";
import PostalCodeExtension from './extensions/fields/PostalCodeExtension.js';
import PostalCodeCheckExtension from './extensions/checks/PostalCodeCheckExtension.js';
import PostalCodeAutocompleteExtension from './extensions/autocomplete/PostalCodeAutocompleteExtension.js';
import LocalityExtension from './extensions/fields/LocalityExtension.js';
import LocalityCheckExtension from './extensions/checks/LocalityCheckExtension.js';
import LocalityAutocompleteExtension from './extensions/autocomplete/LocalityAutocompleteExtension.js';
import StreetNameExtension from './extensions/fields/StreetNameExtension.js';
import StreetNameCheckExtension from './extensions/checks/StreetNameCheckExtension.js';
import StreetNameAutocompleteExtension from './extensions/autocomplete/StreetNameAutocompleteExtension.js';
import BuildingNumberExtension from './extensions/fields/BuildingNumberExtension.js';
import BuildingNumberCheckExtension from './extensions/checks/BuildingNumberCheckExtension.js';
import StreetFullExtension from './extensions/fields/StreetFullExtension.js';
import StreetFullCheckExtension from './extensions/checks/StreetFullCheckExtension.js';
import StreetFullAutocompleteExtension from './extensions/autocomplete/StreetFullAutocompleteExtension.js';
import AdditionalInfoExtension from './extensions/fields/AdditionalInfoExtension.js';
import AdditionalInfoCheckExtension from './extensions/checks/AdditionalInfoCheckExtension.js';
import AddressExtension from './extensions/fields/AddressExtension.js';
import AddressCheckExtension from './extensions/checks/AddressCheckExtension.js';
import SessionExtension from './extensions/session/SessionExtension.js';

function EnderecoAddress(customConfig={}) {

    // Get base object, that will be extended.
    var base = new EnderecoBase();
    base.type = 'address';
    base.name = 'ams';
    base.addressType = 'general_address';

    base.forms = [];

    // Override config.
    base.config = merge(base.config, customConfig);

    // Add extensions.
    base.extensions = [
        CountryCodeExtension,
        CountryCodeCheckExtension,
        SubdivisionCodeExtension,
        SubdivisionCodeCheckExtension,
        PostalCodeExtension,
        PostalCodeCheckExtension,
        PostalCodeAutocompleteExtension,
        LocalityExtension,
        LocalityCheckExtension,
        LocalityAutocompleteExtension,
        StreetNameExtension,
        StreetNameCheckExtension,
        StreetNameAutocompleteExtension,
        StreetFullExtension,
        StreetFullCheckExtension,
        StreetFullAutocompleteExtension,
        BuildingNumberExtension,
        BuildingNumberCheckExtension,
        AdditionalInfoExtension,
        AdditionalInfoCheckExtension,
        AddressExtension,
        AddressCheckExtension,
        SessionExtension
    ]

    // Load extesions.
    base.loadExtensions();

    base.onSubmitUnblock = [];
    base.submitUnblocked = function() {
        var $self = this;
        this.onSubmitUnblock.forEach( function(cb) {
            cb($self);
        })
    };

    base.onAddressSelect.push( function(AddressObject) {
        AddressObject.waitForAllPopupsToClose().then(function() {
            if (window.EnderecoIntegrator && window.EnderecoIntegrator.submitResume) {
                base.beforeSubmitResume();
                window.EnderecoIntegrator.submitResume();
            }
        }).catch()
    })

    // Form submit handler.
    base.cb.onFormSubmit = function(e) {
        window.EnderecoIntegrator.hasSubmit = true;
        if (!base.config.trigger.onsubmit) {
            return true;
        }
        if (base.util.shouldBeChecked()) {
            // First. Block.
            e.preventDefault();
            e.stopPropagation();

            if (base.config.ux.resumeSubmit) {
                if (window.EnderecoIntegrator && !window.EnderecoIntegrator.submitResume) {
                    window.EnderecoIntegrator.submitResume = function() {
                        if(e.target.dispatchEvent(
                            new base.util.CustomEvent(
                                'submit',
                                {
                                    'bubbles': true,
                                    'cancelable': true
                                }
                            )
                        )) {
                            e.target.submit();
                        }
                        window.EnderecoIntegrator.submitResume = undefined;
                    }
                }
            }

            setTimeout(function() {
                base.util.checkAddress()
                    .catch(function() {
                        base.waitForAllPopupsToClose().then(function() {
                            if (window.EnderecoIntegrator && window.EnderecoIntegrator.submitResume) {
                                window.EnderecoIntegrator.submitResume();
                            }
                        }).catch()
                    });
            }, 300);

            return false;
        }
    }

    // Call "onCreate" callbacks.
    base.created();

    return base;
}

export default EnderecoAddress

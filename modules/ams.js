import merge from 'lodash.merge';
import EnderecoBase from './components/base.js'

// Extensions.
import CountryCodeExtension from './extensions/fields/CountryCodeExtension.js';
import CountryCodeCheckExtension from './extensions/checks/CountryCodeCheckExtension.js';
import SubdivisionCodeExtension from "./extensions/fields/SubdivisionCodeExtension";
import SubdivisionCodeCheckExtension from "./extensions/checks/SubdivisionCodeCheckExtension";
import PostalCodeExtension from './extensions/fields/PostalCodeExtension.js';
import PostalCodeCheckExtension from './extensions/checks/PostalCodeCheckExtension.js';
import LocalityExtension from './extensions/fields/LocalityExtension.js';
import LocalityCheckExtension from './extensions/checks/LocalityCheckExtension.js';
import StreetNameExtension from './extensions/fields/StreetNameExtension.js';
import StreetNameCheckExtension from './extensions/checks/StreetNameCheckExtension.js';
import BuildingNumberExtension from './extensions/fields/BuildingNumberExtension.js';
import BuildingNumberCheckExtension from './extensions/checks/BuildingNumberCheckExtension.js';
import StreetFullExtension from './extensions/fields/StreetFullExtension.js';
import StreetFullCheckExtension from './extensions/checks/StreetFullCheckExtension.js';
import AdditionalInfoExtension from './extensions/fields/AdditionalInfoExtension.js';
import AdditionalInfoCheckExtension from './extensions/checks/AdditionalInfoCheckExtension.js';
import AddressExtension from './extensions/fields/AddressExtension.js';
import SessionExtension from './extensions/session/SessionExtension.js';

async function EnderecoAddress(customConfig={}) {

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
        LocalityExtension,
        LocalityCheckExtension,
        StreetNameExtension,
        StreetNameCheckExtension,
        StreetFullExtension,
        StreetFullCheckExtension,
        BuildingNumberExtension,
        BuildingNumberCheckExtension,
        AdditionalInfoExtension,
        AdditionalInfoCheckExtension,
        AddressExtension,
        SessionExtension
    ]

    // Load extesions.
    await base.loadExtensions();

    base.onSubmitUnblock = [];
    base.submitUnblocked = function() {
        var $self = this;
        this.onSubmitUnblock.forEach( function(cb) {
            cb($self);
        })
    };

    base.onBlurTimeout = null;
    base.cb.handleFormBlur = async () => {
        // Clear existing timeout if any
        if (base.onBlurTimeout) {
            clearTimeout(base.onBlurTimeout);
            base.onBlurTimeout = null;
        }

        // Set new timeout for address check
        base.onBlurTimeout = setTimeout(async () => {
            const shouldCheckAddress = base.config.trigger.onblur &&
                !base.anyActive() &&
                base.util.shouldBeChecked();

            if (shouldCheckAddress) {
                clearTimeout(base.onBlurTimeout);
                base.onBlurTimeout = null;
                try {
                    await base.util.checkAddress();
                } catch (error) {
                    console.warn('Error checking address:', error);
                }
            }
        }, base.config.ux.delay.onBlur);
    }

    base.cb.handleFormSubmit = async () => {
        let processState = 'unknown'
        try {
            const result = await base.util.checkAddress();
            switch (result.sourceOfAddress) {
                case 'unverified_user_input': {
                    processState = 'edit_intention'
                    break;
                }
                case 'automatic_copy_from_correction': {
                    processState = 'finished'
                    break;
                }
                case 'confirmed_user_selection': {
                    processState = 'finished'
                    break;
                }
            }

            // It's not clear if checkAddress should be able to raise an exception. At the moment it doesn't, so
            // if there is an error with network connection, we return as "finished" to allow submit resumption
            if (['network_error', 'invalid_result'].includes(result.processStatus)) {
                processState = 'finished'
            }

            return {
                processState
            }
        } catch (err) {
            console.warn("Error handling submit", {
                error: err,
                dataObject: base
            });
            return {
                processState: 'error'
            }
        }
    }

    // Call "onCreate" callbacks.
    base.created();

    return base;
}

export default EnderecoAddress

import merge from 'lodash.merge';
import EnderecoBase from './components/base.js'

// Extensions.
import SalutationExtension from './extensions/fields/SalutationExtension.js';
import SalutationCheckExtension from './extensions/checks/SalutationCheckExtension.js';
import FirstNameExtension from "./extensions/fields/FirstNameExtension.js";
import SessionExtension from "./extensions/session/SessionExtension";

function EnderecoPerson(customConfig={}) {

    // Get base object, that will be extended.
    var base = new EnderecoBase();
    base.type = 'person';
    base.name = 'personservices';

    // Override config.
    base.config = merge(base.config, customConfig);

    // Add extensions.
    base.extensions = [
        SalutationExtension,
        SalutationCheckExtension,
        FirstNameExtension,
        SessionExtension
    ]

    // Load extesions.
    base.loadExtensions();

    // Call "onCreate" callbacks.
    base.created();

    return base;
}

export default EnderecoPerson

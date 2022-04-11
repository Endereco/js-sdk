import merge from 'lodash.merge';
import EnderecoBase from './components/base.js'

// Extensions.
import PhoneExtension from './extensions/fields/PhoneExtension.js';
import PhoneCheckExtension from "./extensions/checks/PhoneCheckExtension";
import SessionExtension from "./extensions/session/SessionExtension";

function EnderecoPhone(customConfig={}) {

    // Get base object, that will be extended.
    var base = new EnderecoBase();
    base.type = 'phone';
    base.name = 'phoneservices';

    // Override config.
    base.config = merge(base.config, customConfig);

    // Add extensions.
    base.extensions = [
        PhoneExtension,
        PhoneCheckExtension,
        SessionExtension
    ]

    // Load extesions.
    base.loadExtensions();

    // Call "onCreate" callbacks.
    base.created();

    return base;
}

export default EnderecoPhone

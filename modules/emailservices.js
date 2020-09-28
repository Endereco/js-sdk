import merge from 'lodash.merge';
import EnderecoBase from "./components/base";

// Extensions.
import EmailExtension from './extensions/fields/EmailExtension.js';
import EmailCheckExtension from './extensions/checks/EmailCheckExtension.js';
import SessionExtension from "./extensions/session/SessionExtension";

function EnderecoEmail(customConfig={}) {

    // Get base object, that will be extended.
    var base = new EnderecoBase();
    base.type = 'email';
    base.name = 'emailservices';

    // Override config.
    base.config = merge(base.config, customConfig);

    // Add extensions.
    base.extensions = [
        EmailCheckExtension,
        EmailExtension,
        SessionExtension
    ]

    // Load extesions.
    base.loadExtensions();

    // Call "onCreate" callbacks.
    base.created();

    return base;
}

export default EnderecoEmail

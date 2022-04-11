import merge from 'lodash.merge';
import EnderecoBase from './components/base.js'

// Extensions.
import SalutationExtension from './extensions/fields/SalutationExtension.js';
import LastNameExtension from './extensions/fields/LastNameExtension.js';
import FirstNameExtension from "./extensions/fields/FirstNameExtension.js";
import TitleExtension from "./extensions/fields/TitleExtension.js";
import SessionExtension from "./extensions/session/SessionExtension";
import NameCheckExtension from "./extensions/checks/NameCheckExtension";

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
        FirstNameExtension,
        LastNameExtension,
        TitleExtension,
        SessionExtension,
        NameCheckExtension
    ]

    // Load extesions.
    base.loadExtensions();

    // Call "onCreate" callbacks.
    base.created();

    return base;
}

export default EnderecoPerson

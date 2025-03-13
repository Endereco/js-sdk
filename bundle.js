import Promise from 'promise-polyfill';
import merge from 'lodash.merge';
import EnderecoIntegrator from './modules/integrator';
import css from './themes/default-theme.scss';

if ('NodeList' in window && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function (callback, thisArg) {
        thisArg = thisArg || window;
        for (var i = 0; i < this.length; i++) {
            callback.call(thisArg, this[i], i, this);
        }
    };
}

if (!window.Promise) {
    window.Promise = Promise;
}

EnderecoIntegrator.postfix = {
    personServices: {
        salutation: '',
        firstName: ''
    },
    emailServices: {
        email: ''
    }
};

if (css) {
    EnderecoIntegrator.css = css[0][1];
}
EnderecoIntegrator.resolvers.countryCodeWrite = function (value, subscriber) {
    return new Promise(function (resolve, reject) {
        resolve(value);
    });
}
EnderecoIntegrator.resolvers.countryCodeRead = function(value, subscriber) {
    return new Promise(function(resolve, reject) {
        resolve(value);
    });
}
EnderecoIntegrator.resolvers.salutationWrite = function(value, subscriber) {
    return new Promise(function(resolve, reject) {
        resolve(value);
    });
}
EnderecoIntegrator.resolvers.salutationRead = function(value, subscriber) {
    return new Promise(function(resolve, reject) {
        resolve(value);
    });
}

EnderecoIntegrator.amsFilters.isAddressMetaStillRelevant.push((isStillRelevant, EAO) => {
    const invalidateAddressForm = document.querySelector('#invalidate-address-form');
    if (invalidateAddressForm && invalidateAddressForm.checked) {
        isStillRelevant = false;
    }
    return isStillRelevant;
});

if (window.EnderecoIntegrator) {
    window.EnderecoIntegrator = merge(window.EnderecoIntegrator, EnderecoIntegrator);
} else {
    window.EnderecoIntegrator = EnderecoIntegrator;
}

window.EnderecoIntegrator.asyncCallbacks.forEach(function(cb) {
    cb();
});
window.EnderecoIntegrator.asyncCallbacks = [];

const anExampleCallback = async (EAO) => {
    console.log("Sleep for 5 sec");
    // Sleep logic
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log("Now resolve anExampleCallback");
}

window.EnderecoIntegrator.afterAMSActivation.push((EAO) => {
    EAO.onEditAddress.push((e) => {
        return anExampleCallback(e);
    })
});

window.EnderecoIntegrator.isAddressFormStillValid = (EAO) => {
    if (EAO.fullName !== 'shipping2_address') {
        return true;
    }

    // Check if EAO.forms exists and is an array
    if (EAO.forms && Array.isArray(EAO.forms)) {
        // Loop through each form in the forms array
        for (let i = 0; i < EAO.forms.length; i++) {
            const form = EAO.forms[i];

            // Check if the form is a DOM element
            if (form instanceof Element) {
                // Look for a checkbox with id "disablethisform"
                const disableCheckbox = form.querySelector('#disablethisform');

                // If the checkbox exists and is checked, return false
                if (disableCheckbox && disableCheckbox.checked) {
                    return false;
                }
            }
        }
    }

    return true;
}

window.EnderecoIntegrator.prepareDOMElement = (DOMElement) => {
    // Check if the element has already been prepared
    if (DOMElement._enderecoBlurListenerAttached) {
        return; // Skip if already prepared
    }

    const enderecoBlurListener = (e) => {
        // Dispatch 'focus' and 'blur' events on the target element
        let prevActiveElement = document.activeElement;
        e.target.dispatchEvent(new CustomEvent('focus', { bubbles: true, cancelable: true }));
        e.target.dispatchEvent(new CustomEvent('blur', { bubbles: true, cancelable: true }));
        prevActiveElement.dispatchEvent(new CustomEvent('focus', { bubbles: true, cancelable: true }));
    }

    DOMElement.addEventListener('endereco-blur', enderecoBlurListener);

    // Mark the element as prepared
    DOMElement._enderecoBlurListenerAttached = true;
}

var $waitForConfig = setInterval( function() {
    if(typeof enderecoLoadAMSConfig === 'function'){
        enderecoLoadAMSConfig();
        clearInterval($waitForConfig);
    }
}, 1);


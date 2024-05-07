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
    ams: {
        countryCode: '',
        postalCode: '',
        locality: '',
        streetFull: '',
        streetName: '',
        buildingNumber: '',
        addressStatus: '',
        addressTimestamp: '',
        addressPredictions: '',
        additionalInfo: '',
    },
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

window.EnderecoIntegrator.waitUntilReady().then( function() {

});

var $waitForConfig = setInterval( function() {
    if(typeof enderecoLoadAMSConfig === 'function'){
        enderecoLoadAMSConfig();
        clearInterval($waitForConfig);
    }
}, 1);


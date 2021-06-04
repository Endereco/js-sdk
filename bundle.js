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

EnderecoIntegrator.css = css[0][1];
EnderecoIntegrator.resolvers.countryCodeWrite = function(value) {
    return new Promise(function(resolve, reject) {
        resolve(value);
    });
}
EnderecoIntegrator.resolvers.countryCodeRead = function(value) {
    return new Promise(function(resolve, reject) {
        resolve(value);
    });
}
EnderecoIntegrator.resolvers.salutationWrite = function(value) {
    return new Promise(function(resolve, reject) {
        resolve(value);
    });
}
EnderecoIntegrator.resolvers.salutationRead = function(value) {
    return new Promise(function(resolve, reject) {
        resolve(value);
    });
}

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
    //
});


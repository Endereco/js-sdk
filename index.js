import 'classlist-polyfill';
import Promise from 'promise-polyfill';
import 'core-js/fn/promise/finally';
import merge from 'lodash.merge';
import 'polyfill-array-includes';
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

import EnderecoSubscriber from './modules/subscriber.js';
import EnderecoAddressObject from './modules/ams.js';
import EnderecoEmailObject from './modules/emailservices.js';
import EnderecoPersonObject from './modules/personservices.js';

window.EnderecoAddressObject = EnderecoAddressObject;
window.EnderecoEmailObject = EnderecoEmailObject;
window.EnderecoPersonObject = EnderecoPersonObject;
window.EnderecoSubscriber = EnderecoSubscriber;

var EnderecoIntegrator = {
    popupQueue: 0,
    ready: false,
    loaded: true,
    countryMappingUrl: '',
    defaultCountry: 'de',
    defaultCountrySelect: false,
    billingAutocheck: false,
    shippingAutocheck: false,
    config: {
        apiUrl: '',
        remoteApiUrl: '',
        apiKey: '',
        lang: ( function() {
            if (document.querySelector('html').lang) {
                // TODO: check if the language is in the list of possible languages and return "de" if not.
                return document.documentElement.lang.slice(0,2);
            } else {
                return 'de';
            }
        })(),
        showDebugInfo: true,
        splitStreet: true,
        ux: {
            smartFill: true,
            smartFillBlockTime: 600,
            resumeSubmit: true,
            disableBrowserAutocomplete: true,
            maxAutocompletePredictionItems: 6,
            maxAddressPredictionItems: 3,
            delay: {
                inputAssistant: 100,
                streetCopy: 600
            },
            requestTimeout: 4000
        },
        trigger: {
            onblur: true,
            onsubmit: true
        },
        texts: {
            popUpHeadline: 'Adresse pr&uuml;fen',
            popUpSubline: 'Die eingegebene Adresse scheint nicht korrekt oder unvollständig zu sein. Bitte eine korrekte Adresse wählen.',
            yourInput: 'Ihre Eingabe:',
            editYourInput: '(bearbeiten)',
            ourSuggestions: 'Unsere Vorschläge:',
            useSelected: 'Auswahl übernehmen',
            popupHeadlines: {
                general_address: 'Adresse pr&uuml;fen',
                billing_address: 'Rechnungsadresse pr&uuml;fen',
                shipping_address: 'Lieferadresse pr&uuml;fen'
            }
        },
        templates: {
            button: '<button class="endereco-button endereco-button-primary" endereco-use-selection>{{{EnderecoAddressObject.config.texts.useSelected}}}</button>'
        }
    },
    postfix: {
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
            salutation: '',
            firstName: '',
            email: ''
        }
    },
    activeServices: {
        ams: true,
        emailService: true,
        personService: true
    },
    checkAllCallback: function() {
        return;
    },
    mappings: {
        gender: {
            'M': 'mr',
            'F': 'ms',
            getByCode: function(code) {
                if (this[code]) {
                    return this[code]
                } else {
                    return '';
                }
            },
            getBySalutation: function(salutation) {
                var $return = '';
                for (var prop in this) {
                    if (Object.prototype.hasOwnProperty.call(this, prop)) {
                        if (this[prop] === salutation) {
                            return prop;
                        }
                    }
                }
                return $return;
            }
        }
    },
    initAMS: function(prefix, options= {postfixCollection: {}, addressType: 'general_address'}) {
        if (!this.activeServices.ams) {
            return;
        }
        return;
    },
    initEmailServices: function(prefix, options= {postfixCollection: {}}) {
        if (!this.activeServices.emailService) {
            return;
        }
        return;
    },
    initPersonServices: function(prefix, options= {postfixCollection: {}}) {
        if (!this.activeServices.personService) {
            return;
        }
        return;
    },
    waitUntilReady: function() {
        var $self = this;
        return new Promise(function(resolve, reject) {
            var $interval = setInterval(function() {
                if ($self.ready) {
                    clearInterval($interval)
                    resolve();
                }
            }, 100);
        })
    },
    integratedObjects: {},
    asyncCallbacks: []
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

export default EnderecoIntegrator

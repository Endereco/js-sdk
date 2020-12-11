import merge from "lodash.merge";
import EnderecoAddressObject from "./ams";
import EnderecoSubscriber from "./subscriber";
import EnderecoEmailObject from "./emailservices";
import EnderecoPersonObject from "./personservices";
import 'core-js/fn/promise/finally';

var EnderecoIntegrator = {
    popupQueue: 0,
    ready: false,
    loaded: true,
    countryMappingUrl: '',
    defaultCountry: 'de',
    defaultCountrySelect: false,
    billingAutocheck: false,
    shippingAutocheck: false,
    globalSpace: {
        reloadPage: function() {
            location.reload();
        }
    },
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
            useStandardCss: true,
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
            button: '<button class="{{{EnderecoAddressObject.config.templates.buttonClasses}}}" endereco-use-selection>{{{EnderecoAddressObject.config.texts.useSelected}}}</button>',
            buttonClasses: 'endereco-button endereco-button-primary'
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
        },
        emailServices: {
            email: ''
        },
        personServices: {
            salutation: '',
            firstName: ''
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
    resolvers: {
        addressPredictionsWrite: function(value) {
            return new Promise(function(resolve, reject) {
                if (!value) {
                    resolve(value);
                    return;
                }
                try {
                    resolve(JSON.stringify(value));
                } catch(e) {
                    console.log('Error stringify json', e);
                    reject(e);
                }
            });
        },
        addressPredictionsRead: function(value) {
            return new Promise(function(resolve, reject) {
                if (!value) {
                    resolve(value);
                    return;
                }
                try {
                    resolve(JSON.parse(value));
                } catch(e) {
                    console.log('Error parse json', e);
                    reject(e);
                }
            });
        }
    },
    initAMS: function(
        prefix,
        options= {
            postfixCollection: {},
            addressType: 'general_address',
            name: 'default'
        }
    ) {
        $self = this;
        if (!this.activeServices.ams) {
            return;
        }

        var $self = this;
        var config = JSON.parse(JSON.stringify(this.config));

        if (!!options.config) {
            config = merge(config, options.config);
        }

        var originalPostfix = merge({}, $self.postfix.ams);
        var postfix;

        if ('object' === typeof prefix) {
            postfix = merge(originalPostfix, prefix);
            prefix = '';
        } else {
            var newObject = {};
            Object.keys(originalPostfix).forEach(function(key) {
                newObject[key] = prefix + originalPostfix[key];

            });
            postfix = merge(newObject, options.postfixCollection);
        }

        var EAO = new EnderecoAddressObject(config);
        EAO.fullName = options.name + '_' + EAO.name;

        // If change order.
        if (EAO.config.ux.changeFieldsOrder) {
            $self.changeFieldsOrder(postfix)
        }

        EAO.waitForAllExtension().then( function() {
            // Add subscribers.
            if (
                $self.dispatchEvent('endereco.ams.before-adding-subscribers')
            ) {

                // In general with every subscriber we first check, if the html element exists
                // Then we trigger an event.
                if (
                    document.querySelector($self.getSelector(postfix.countryCode)) &&
                    $self.dispatchEvent('endereco.ams.before-adding-country-code-subscriber')
                ) {
                    var countryCodeSubscriberOptions = {};
                    if (!!$self.resolvers.countryCodeWrite) {
                        countryCodeSubscriberOptions['writeFilterCb'] = function(value) {
                            return $self.resolvers.countryCodeWrite(value);
                        }
                    }
                    if (!!$self.resolvers.countryCodeRead) {
                        countryCodeSubscriberOptions['readFilterCb'] = function(value) {
                            return $self.resolvers.countryCodeRead(value);
                        }
                    }
                    if (!!$self.resolvers.countryCodeSetValue) {
                        countryCodeSubscriberOptions['customSetValue'] = function(subscriber, value) {
                            return $self.resolvers.countryCodeSetValue(subscriber, value);
                        }
                    }
                    var countryCodeSubscriber = new EnderecoSubscriber(
                        'countryCode',
                        document.querySelector($self.getSelector(postfix.countryCode)),
                        countryCodeSubscriberOptions
                    )
                    EAO.addSubscriber(countryCodeSubscriber);

                    $self.dispatchEvent('endereco.ams.after-adding-country-code-subscriber'); // Add after hook.
                }

                if (
                    document.querySelector($self.getSelector(postfix.postalCode)) &&
                    $self.dispatchEvent('endereco.ams.before-adding-postal-code-subscriber')
                ) {
                    var postalCodeSubscriber = new EnderecoSubscriber(
                        'postalCode',
                        document.querySelector($self.getSelector(postfix.postalCode)),
                        {
                            displayAutocompleteDropdown: true
                        }
                    )
                    EAO.addSubscriber(postalCodeSubscriber);

                    $self.dispatchEvent('endereco.ams.after-adding-postal-code-subscriber'); // Add after hook.
                }

                if (
                    document.querySelector($self.getSelector(postfix.locality)) &&
                    $self.dispatchEvent('endereco.ams.before-adding-locality-subscriber')
                ) {
                    var localitySubscriber = new EnderecoSubscriber(
                        'locality',
                        document.querySelector($self.getSelector(postfix.locality)),
                        {
                            displayAutocompleteDropdown: true
                        }
                    )
                    EAO.addSubscriber(localitySubscriber);
                    $self.dispatchEvent('endereco.ams.after-adding-locality-subscriber'); // Add after hook.
                }

                if (
                    document.querySelector($self.getSelector(postfix.streetFull)) &&
                    $self.dispatchEvent('endereco.ams.before-adding-street-full-subscriber')
                ) {
                    var streetFullSubscriber = new EnderecoSubscriber(
                        'streetFull',
                        document.querySelector($self.getSelector(postfix.streetFull)),
                        {
                            displayAutocompleteDropdown: true
                        }
                    )
                    EAO.addSubscriber(streetFullSubscriber);
                    $self.dispatchEvent('endereco.ams.after-adding-street-full-subscriber'); // Add after hook.
                }

                if (
                    document.querySelector($self.getSelector(postfix.streetName)) &&
                    $self.dispatchEvent('endereco.ams.before-adding-street-name-subscriber')
                ) {
                    var streetNameSubscriber = new EnderecoSubscriber(
                        'streetName',
                        document.querySelector($self.getSelector(postfix.streetName)),
                        {
                            displayAutocompleteDropdown: true
                        }
                    )
                    EAO.addSubscriber(streetNameSubscriber);
                    $self.dispatchEvent('endereco.ams.after-adding-street-name-subscriber'); // Add after hook.
                }

                if (
                    document.querySelector($self.getSelector(postfix.buildingNumber)) &&
                    $self.dispatchEvent('endereco.ams.before-adding-building-number-subscriber')
                ) {
                    var buildingNumberSubscriber = new EnderecoSubscriber(
                        'buildingNumber',
                        document.querySelector($self.getSelector(postfix.buildingNumber))
                    )
                    EAO.addSubscriber(buildingNumberSubscriber);
                    $self.dispatchEvent('endereco.ams.after-adding-building-number-subscriber'); // Add after hook.
                }

                if (
                    document.querySelector($self.getSelector(postfix.additionalInfo)) &&
                    $self.dispatchEvent('endereco.ams.before-adding-additional-info-subscriber')
                ) {
                    var additionalInfoSubscriber = new EnderecoSubscriber(
                        'additionalInfo',
                        document.querySelector($self.getSelector(postfix.additionalInfo))
                    )
                    EAO.addSubscriber(additionalInfoSubscriber);
                    $self.dispatchEvent('endereco.ams.after-adding-additional-info-subscriber'); // Add after hook.
                }

                if (
                    document.querySelector($self.getSelector(postfix.addressTimestamp)) &&
                    $self.dispatchEvent('endereco.ams.before-adding-address-timestamp-subscriber')
                ) {
                    var addressTimestampSubscriber = new EnderecoSubscriber(
                        'addressTimestamp',
                        document.querySelector($self.getSelector(postfix.addressTimestamp))
                    )
                    EAO.addSubscriber(addressTimestampSubscriber);
                    $self.dispatchEvent('endereco.ams.after-adding-address-timestamp-subscriber'); // Add after hook.
                }

                if (
                    document.querySelector($self.getSelector(postfix.addressPredictions)) &&
                    $self.dispatchEvent('endereco.ams.before-adding-address-predictions-subscriber')
                ) {
                    var addressPredictionsSubscriber = new EnderecoSubscriber(
                        'addressPredictions',
                        document.querySelector($self.getSelector(postfix.addressPredictions)),
                        {
                            writeFilterCb: function(value) {
                                if (!!$self.resolvers.addressPredictionsWrite) {
                                    return $self.resolvers.addressPredictionsWrite(value);
                                } else {
                                    return new EAO.util.Promise(function(resolve, reject) {
                                        resolve(value);
                                    });
                                }
                            },
                            readFilterCb: function(value) {
                                if (!!$self.resolvers.addressPredictionsRead) {
                                    return $self.resolvers.addressPredictionsRead(value);
                                } else {
                                    return new EAO.util.Promise(function(resolve, reject) {
                                        resolve(value);
                                    });
                                }
                            }
                        }
                    )
                    EAO.addSubscriber(addressPredictionsSubscriber);
                    $self.dispatchEvent('endereco.ams.after-adding-address-predictions-subscriber'); // Add after hook.
                }

                if (
                    document.querySelector($self.getSelector(postfix.addressStatus)) &&
                    $self.dispatchEvent('endereco.ams.before-adding-address-status-subscriber')
                ) {
                    var addressStatusSubscriber = new EnderecoSubscriber(
                        'addressStatus',
                        document.querySelector($self.getSelector(postfix.addressStatus))
                    )
                    EAO.addSubscriber(addressStatusSubscriber);
                    $self.dispatchEvent('endereco.ams.after-adding-address-status-subscriber'); // Add after hook.
                }

                $self.dispatchEvent('endereco.ams.after-adding-subscribers')
            }

            EAO.waitUntilReady().then(function() {
                EAO.syncValues().then(function() {
                    EAO.waitUntilReady().then(function() {
                        if (!EAO.countryCode && $self.defaultCountrySelect) {
                            EAO.countryCode = $self.defaultCountry;
                        }

                        // Start setting default values.
                        if (!!options.addressType) {
                            EAO._addressType = options.addressType
                        }

                        EAO._changed = false;
                        EAO.activate();
                        $self.afterAMSActivation.forEach( function(callback) {
                            callback(EAO);
                        })

                        EAO.waitUntilReady().then(function() {
                            EAO.util.calculateDependingStatuses();
                        }).catch();

                        // If automated check is active, render the address selection field.
                        if (
                            EAO.config.ux.checkExisting && (
                                EAO.addressStatus.includes('address_needs_correction') ||
                                EAO.addressStatus.includes('address_multiple_variants') ||
                                EAO.addressStatus.includes('address_not_checked')
                            ) &&
                            !EAO.addressStatus.includes('address_selected_by_customer')
                        ) {
                            EAO.util.renderAddressPredictionsPopup();
                        }
                    }).catch();
                }).catch()
            }).catch();
        }).catch();

        this.integratedObjects[EAO.fullName] = EAO;
        return EAO;
    },
    afterAMSActivation: [],
    initEmailServices: function(
        prefix,
        options = {
            postfixCollection: {},
            name: 'default'
        }
    ) {
        if (!this.activeServices.emailService) {
            return;
        }

        var $self = this;
        var config = JSON.parse(JSON.stringify(this.config));
        var postfix;

        if ('object' === typeof prefix) {
            postfix = merge($self.postfix.emailServices, prefix);
            prefix = '';
        } else {
            postfix = merge($self.postfix.emailServices, options.postfixCollection);
        }

        var EEO = new EnderecoEmailObject(config);
        EEO.fullName = options.name + '_' + EEO.name;

        EEO._awaits++;
        EEO.waitForAllExtension().then( function() {
            if (
                $self.dispatchEvent('endereco.es.before-adding-subscribers')
            ) {
                if (
                    document.querySelector($self.getSelector(prefix + postfix.email)) &&
                    $self.dispatchEvent('endereco.es.before-adding-email-subscriber')
                ) {
                    var emailSubscriber = new EnderecoSubscriber(
                        'email',
                        document.querySelector($self.getSelector(prefix + postfix.email)),
                        {
                            writeFilterCb: function(value) {
                                if (!!$self.resolvers.emailWrite) {
                                    return $self.resolvers.emailWrite(value);
                                } else {
                                    return new EEO.util.Promise(function(resolve, reject) {
                                        resolve(value);
                                    });
                                }
                            },
                            readFilterCb: function(value) {
                                if (!!$self.resolvers.emailRead) {
                                    return $self.resolvers.emailRead(value);
                                } else {
                                    return new EEO.util.Promise(function(resolve, reject) {
                                        resolve(value);
                                    });
                                }
                            }
                        }
                    )
                    EEO.addSubscriber(emailSubscriber);
                    $self.dispatchEvent('endereco.es.after-adding-email-subscriber'); // Add after hook.
                }

                if (
                    document.querySelector($self.getSelector(prefix + postfix.email)) &&
                    $self.dispatchEvent('endereco.es.before-adding-email-status-subscriber')
                ) {
                    var emailStatusSubscriber = new EnderecoSubscriber(
                        'emailStatus',
                        document.querySelector($self.getSelector(prefix + postfix.email)),
                        {
                            writeFilterCb: function(value) {
                                if (!!$self.resolvers.emailStatusWrite) {
                                    return $self.resolvers.emailStatusWrite(value);
                                } else {
                                    return new EEO.util.Promise(function(resolve, reject) {
                                        resolve(value);
                                    });
                                }
                            },
                            readFilterCb: function(value) {
                                if (!!$self.resolvers.emailStatusRead) {
                                    return $self.resolvers.emailStatusRead(value);
                                } else {
                                    return new EEO.util.Promise(function(resolve, reject) {
                                        resolve(value);
                                    });
                                }
                            },
                            valueContainer: 'classList'
                        }
                    )
                    EEO.addSubscriber(emailStatusSubscriber);
                    $self.dispatchEvent('endereco.es.after-adding-email-status-subscriber'); // Add after hook.
                }

                $self.dispatchEvent('endereco.es.after-adding-subscribers')
            }

            EEO._awaits--;
        }).catch();

        EEO.waitUntilReady().then(function() {
            EEO.syncValues().then(function() {
                EEO.waitUntilReady().then(function() {
                    EEO._changed = false;
                    EEO.activate();
                }).catch();
            }).catch()
        }).catch();

        this.integratedObjects[EEO.fullName] = EEO;
        return EEO;
    },
    initPersonServices: function(
        prefix = '',
        options= {
            postfixCollection: {},
            name: 'default'
        }
    ) {
        $self = this;
        if (!this.activeServices.personService) {
            return;
        }

        var $self = this;
        var config = JSON.parse(JSON.stringify(this.config));

        if (!!options.config) {
            config = merge(config, options.config);
        }

        var originalPostfix = merge({}, $self.postfix.personServices);
        var postfix;

        if ('object' === typeof prefix) {
            postfix = merge(originalPostfix, prefix);
            prefix = '';
        } else {
            postfix = merge(originalPostfix, options.postfixCollection);
        }

        var EPO = new EnderecoPersonObject(config);
        EPO.fullName = options.name + '_' + EPO.name;

        EPO._awaits++;
        EPO.waitForAllExtension().then( function() {
            // Add subscribers.
            if (
                $self.dispatchEvent('endereco.ps.before-adding-subscribers')
            ) {
                // In general with every subscriber we first check, if the html element exists
                if (
                    document.querySelector($self.getSelector(prefix + postfix.salutation)) &&
                    $self.dispatchEvent('endereco.ps.before-adding-salutation-subscriber')
                ) {
                    var salutationSubscriber = new EnderecoSubscriber(
                        'salutation',
                        document.querySelector($self.getSelector(prefix + postfix.salutation)),
                        {
                            writeFilterCb: function(value) {
                                if (!!$self.resolvers.salutationWrite) {
                                    return $self.resolvers.salutationWrite(value);
                                } else {
                                    return new EPO.util.Promise(function(resolve, reject) {
                                        resolve(value);
                                    });
                                }
                            },
                            readFilterCb: function(value) {
                                if (!!$self.resolvers.salutationRead) {
                                    return $self.resolvers.salutationRead(value);
                                } else {
                                    return new EPO.util.Promise(function(resolve, reject) {
                                        resolve(value);
                                    });
                                }
                            }
                        }
                    )
                    EPO.addSubscriber(salutationSubscriber);

                    $self.dispatchEvent('endereco.ps.after-adding-salutation-subscriber'); // Add after hook.
                }
                // In general with every subscriber we first check, if the html element exists
                if (
                    document.querySelector($self.getSelector(prefix + postfix.firstName)) &&
                    $self.dispatchEvent('endereco.ps.before-adding-first-name-subscriber')
                ) {
                    var firstNameSubscriber = new EnderecoSubscriber(
                        'firstName',
                        document.querySelector($self.getSelector(prefix + postfix.firstName)),
                        {
                            writeFilterCb: function(value) {
                                if (!!$self.resolvers.firstNameWrite) {
                                    return $self.resolvers.firstNameWrite(value);
                                } else {
                                    return new EPO.util.Promise(function(resolve, reject) {
                                        resolve(value);
                                    });
                                }
                            },
                            readFilterCb: function(value) {
                                if (!!$self.resolvers.firstNameRead) {
                                    return $self.resolvers.firstNameRead(value);
                                } else {
                                    return new EPO.util.Promise(function(resolve, reject) {
                                        resolve(value);
                                    });
                                }
                            }
                        }
                    )
                    EPO.addSubscriber(firstNameSubscriber);

                    $self.dispatchEvent('endereco.ps.after-adding-first-name-subscriber'); // Add after hook.
                }
            }

            EPO._awaits--;
        });

        EPO.waitUntilReady().then(function() {
            EPO.syncValues().then(function() {
                EPO.waitUntilReady().then(function() {
                    // Start setting default values.
                    EPO._changed = false;
                    EPO.activate();
                }).catch();
            }).catch()
        }).catch();

        this.integratedObjects[EPO.fullName] = EPO;
        return EPO;
    },
    waitUntilReady: function() {
        var $self = this;
        return new Promise(function(resolve, reject) {
            var interval = setInterval(function() {
                if ($self.ready) {
                    resolve();
                }
            }, 100);
        })
    },
    getSelector: function(possibleSelector) {
        var selector = '';
        if (
            (possibleSelector.indexOf('#') === -1) &&
            (possibleSelector.indexOf('.') === -1) &&
            (possibleSelector.indexOf('=') === -1)
        ) {
            selector = '[name="'+possibleSelector+'"]';
        } else {
            selector = possibleSelector;
        }
        return selector;
    },
    integratedObjects: {},
    asyncCallbacks: [],
    addCss: function() {
        if (!!this.css && this.config.ux.useStandardCss) {
            var head = document.querySelector('head');
            var linkElement = document.createElement('link');
            linkElement.setAttribute('rel', 'stylesheet');
            linkElement.setAttribute('type', 'text/css');
            linkElement.setAttribute('href', 'data:text/css;charset=UTF-8,' + encodeURIComponent(this.css));
            head.appendChild(linkElement);
        }
    },
    dispatchEvent: function(event) {
        return true;
    },
    _createParentLine: function(fieldName, collector, collection) {
        if (document.querySelector((this.getSelector(collection[fieldName])))) {
            collector[fieldName] = {
                commonElementIndex: 0,
                rowElementIndex: 0,
                columnElementIndex: 0,
                parentLine: [document.querySelector((this.getSelector(collection[fieldName])))]
            }
            while (1) {
                if (collector[fieldName].parentLine[collector[fieldName].parentLine.length-1].parentNode) {
                    var temp = collector[fieldName].parentLine[collector[fieldName].parentLine.length-1].parentNode;
                    collector[fieldName].parentLine.push(temp);
                } else {
                    break;
                }
            }
        }
    },
    _firstBeforeSecond: function(firstFieldName, secondFieldName, collector) {
        if (
            !collector[firstFieldName] ||
            !collector[secondFieldName]
        ) {
            return;
        }

        // Find commen parent.
        var firstFieldData = collector[firstFieldName];
        var firstFieldIndex = 0;
        var secondFieldData = collector[secondFieldName];
        var secondFieldIndex = 0;
        var commonParentDOM = undefined;
        if (firstFieldData.parentLine && secondFieldData.parentLine) {
            firstFieldData.parentLine.forEach( function(firstFieldParentDOM) {
                if (commonParentDOM) {
                    return;
                }
                secondFieldIndex = 0;
                secondFieldData.parentLine.forEach( function(secondFieldParentDOM) {
                    if (commonParentDOM) {
                        return;
                    }
                    if (firstFieldParentDOM === secondFieldParentDOM) {
                        commonParentDOM = firstFieldParentDOM;
                        firstFieldData.commonElementIndex = firstFieldIndex;
                        firstFieldData.rowElementIndex = Math.max(firstFieldIndex-1, 0);
                        firstFieldData.columnElementIndex =  Math.max(firstFieldIndex-2, 0);
                        secondFieldData.commonElementIndex = secondFieldIndex;
                        secondFieldData.rowElementIndex =  Math.max(secondFieldIndex-1, 0);
                        secondFieldData.columnElementIndex =  Math.max(secondFieldIndex-2, 0);
                    }
                    secondFieldIndex++;
                })

                firstFieldIndex++;
            })

            if (commonParentDOM) {
                commonParentDOM.insertBefore(
                    firstFieldData.parentLine[firstFieldData.rowElementIndex],
                    secondFieldData.parentLine[secondFieldData.rowElementIndex]
                )
            }
        }
    },
    _test: {},
    changeFieldsOrder: function(collection, fieldNamesOrder = ['countryCode', 'postalCode', 'locality', 'streetName','buildingNumber', 'additionalInfo']) {
        var myStructure = {};

        // Create parent line for additional info if it exists.
        this._createParentLine('additionalInfo', this._test, collection);
        this._createParentLine('buildingNumber', this._test, collection);
        this._createParentLine('streetName', this._test, collection);
        this._createParentLine('streetFull', this._test, collection);
        this._createParentLine('locality', this._test, collection);
        this._createParentLine('postalCode', this._test, collection);
        this._createParentLine('countryCode', this._test, collection);

        // Ensure position.
        var reversedArray = new Array;
        for(var i = fieldNamesOrder.length-1; i >= 0; i--) {
            // Filterout if not existing.
            if (
                document.querySelector(
                    this.getSelector(collection[fieldNamesOrder[i]])
                )
            ) {
                reversedArray.push(fieldNamesOrder[i]);
            }
        }

        // Change positions in the DOM.
        for (var j=0; j<(reversedArray.length-1); j++) {
            this._firstBeforeSecond(reversedArray[j+1], reversedArray[j], this._test);
        }
    }
}

EnderecoIntegrator.waitUntilReady().then( function() {
    EnderecoIntegrator.addCss();
}).catch();

export default EnderecoIntegrator;

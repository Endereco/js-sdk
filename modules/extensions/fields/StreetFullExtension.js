import Mustache from "mustache";
import streetFullTemplateFactory from "../../../templates/streetNameTemplates";

var StreetFullExtension = {
    name: 'StreetFullExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject._streetFull = '';
            ExtendableObject._subscribers.streetFull = [];

            ExtendableObject.config.templates.streetFull = streetFullTemplateFactory;

            ExtendableObject.cb.setStreetFull = function(streetFull) {
                return new ExtendableObject.util.Promise(function(resolve, reject) {
                    resolve(streetFull);
                });
            };

            ExtendableObject.cb.streetFullChange = function(subscriber) {
                return function(e) {
                    ExtendableObject.streetFull = subscriber.value;
                }
            };

            ExtendableObject.cb.streetFullBlur = function(subscriber) {
                return function(e) {
                    ExtendableObject.waitUntilReady().then(function() {

                        if (ExtendableObject.onBlurTimeout) {
                            clearTimeout(ExtendableObject.onBlurTimeout);
                            ExtendableObject.onBlurTimeout = null;
                        }
                        ExtendableObject.onBlurTimeout = setTimeout( function() {
                            if (ExtendableObject.config.trigger.onblur && !ExtendableObject.anyActive() && ExtendableObject.util.shouldBeChecked() && !window.EnderecoIntegrator.hasSubmit) {
                                // Second. Check Address.
                                clearTimeout(ExtendableObject.onBlurTimeout);
                                ExtendableObject.onBlurTimeout = null;
                                ExtendableObject.util.checkAddress().catch();
                            }
                        }, 300);
                    }).catch()
                }
            };

            ExtendableObject.util.splitStreet = function(streetFull = null) {
                if (!streetFull) {
                    streetFull = ExtendableObject.streetFull;
                }

                return new ExtendableObject.util.Promise(function(resolve, reject) {
                    var message = {
                        'jsonrpc': '2.0',
                        'id': 1,
                        'method': 'splitStreet',
                        'params': {
                            'formatCountry': (!!ExtendableObject.countryCode)?ExtendableObject.countryCode:'de',
                            'language': ExtendableObject.config.lang,
                            'street': streetFull
                        }
                    };

                    // Send user data to remote server for validation.
                    ExtendableObject._awaits++;
                    ExtendableObject.util.axios.post(ExtendableObject.config.apiUrl, message, {
                        timeout: 2000,
                        headers: {
                            'X-Auth-Key': ExtendableObject.config.apiKey,
                            'X-Remote-Api-Url': ExtendableObject.config.remoteApiUrl,
                            'X-Transaction-Referer': window.location.href,
                            'X-Transaction-Id': 'not_required'
                        }
                    })
                        .then(function(response) {
                            if (undefined !== response.data.result) {
                                resolve(response.data.result);
                            } else {
                                reject(response.data)
                            }
                        })
                        .catch(function(e) {
                            reject(e.response)
                        })
                        .finally( function() {
                            ExtendableObject._awaits--;
                        });
                })
            }

            // Add util function
            ExtendableObject.util.formatStreetFull = function(streetData = null) {
                var $self = ExtendableObject;
                if (null === streetData) {
                    streetData = {
                        countryCode: $self.countryCode,
                        streetName: $self.streetName,
                        buildingNumber: $self.buildingNumber,
                        additionalInfo: $self.additionalInfo
                    }
                }
                return $self.util.Mustache.render(
                    $self.config.templates.streetFull.getTemplate(streetData.countryCode),
                    streetData
                ).replace(/  +/g, ' ').replace(/(\r\n|\n|\r)/gm, "");
            }

            // Add getter and setter for fields.
            Object.defineProperty(ExtendableObject, 'streetFull', {
                get: function() {
                    return this._streetFull;
                },
                set: function(value) {
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.cb.setStreetFull(value).then( function(value) {
                            var oldValue = ExtendableObject._streetFull;
                            var newValue = value;

                            var notSame = ExtendableObject._streetFull !== value;

                            // Chunk set.
                            if (ExtendableObject.hasLoadedExtension('StreetFullAutocompleteExtension')) {
                                notSame = notSame || ( ExtendableObject._streetFullChunk !== value );
                            }

                            if (notSame) {
                                ExtendableObject._streetFull = value;

                                if (ExtendableObject.hasLoadedExtension('StreetFullAutocompleteExtension')) {
                                    ExtendableObject._streetFullChunk = value;
                                }

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.streetFull.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                if (ExtendableObject.active) {
                                    ExtendableObject.fire(
                                        new ExtendableObject.util.CustomEvent(
                                            'change',
                                            {
                                                detail: {
                                                    fieldName: 'streetFull',
                                                    oldValue: oldValue,
                                                    newValue: newValue,
                                                    object: ExtendableObject
                                                }
                                            }
                                        )
                                    );
                                }

                            }

                            // Split and write sub parts.
                            if (
                                ExtendableObject.hasLoadedExtension('StreetNameExtension') &&
                                ExtendableObject.hasLoadedExtension('BuildingNumberExtension') &&
                                ['general_address', 'shipping_address', 'billing_address'].includes(ExtendableObject.addressType)
                            ) {
                                ExtendableObject.waitForActive().then(function() {
                                    ExtendableObject._awaits++;
                                    ExtendableObject.util.splitStreet().then(function(data) {
                                        if (
                                            ExtendableObject.hasLoadedExtension('StreetNameExtension') &&
                                            !!data.streetName
                                        ) {
                                            ExtendableObject.setField('streetName', data.streetName, false);
                                        }
                                        if (
                                            ExtendableObject.hasLoadedExtension('BuildingNumberExtension') &&
                                            !!data.houseNumber
                                        ) {
                                            ExtendableObject.setField('buildingNumber', data.houseNumber, false);
                                        }
                                        if (
                                            ExtendableObject.hasLoadedExtension('AdditionalInfoExtension') &&
                                            !!data.additionalInfo
                                        ) {
                                            ExtendableObject.setField('additionalInfo', data.additionalInfo, false);
                                        }
                                    }).catch(function(e) {
                                        if (
                                            ExtendableObject.hasLoadedExtension('StreetNameExtension')
                                        ) {
                                            ExtendableObject.setField('streetName', ExtendableObject.streetFull, false);
                                        }
                                    }).finally(function() {
                                        ExtendableObject._awaits--;
                                    })
                                }).catch();
                            }

                        }).catch(function(e) {
                            if (ExtendableObject.config.showDebugInfo) {
                                console.log('Error resolving streetFull', e);
                            }
                        }).finally(function() {
                            ExtendableObject._awaits--;
                        });
                    }).catch().finally(function() {
                        ExtendableObject._awaits--;
                    });
                }
            });

            ExtendableObject.fieldNames.push('streetFull');

            if (ExtendableObject.config.showDebugInfo) {
                console.log('StreetFullExtension applied');
            }

            resolve($self);
        });
    }
}

export default StreetFullExtension

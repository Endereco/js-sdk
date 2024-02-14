import Mustache from "mustache";
import streetFullTemplateFactory from "../../../templates/streetNameTemplates";

var StreetFullExtension = {
    name: 'StreetFullExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject._streetFull = '';
            ExtendableObject._subscribers.streetFull = [];
            ExtendableObject._streetFullSplitRequestIndex = 1;
            ExtendableObject.config.templates.streetFull = streetFullTemplateFactory;

            ExtendableObject._localStreetFullState = 1;

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
                        'id': ExtendableObject._streetFullSplitRequestIndex,
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
                            'X-Agent': ExtendableObject.config.agentName,
                            'X-Remote-Api-Url': ExtendableObject.config.remoteApiUrl,
                            'X-Transaction-Referer': window.location.href,
                            'X-Transaction-Id': 'not_required'
                        }
                    })
                        .then(function(response) {
                            if (undefined !== response.data.result && (ExtendableObject._streetFullSplitRequestIndex === response.data.id)) {
                                resolve(response.data);
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
                ).replace(/  +/g, ' ').replace(/(\r\n|\n|\r)/gm, "").trim();
            }

            // Add getter and setter for fields.
            var $oldFullStreet;
            Object.defineProperty(ExtendableObject, 'streetFull', {
                get: function() {
                    return this._streetFull;
                },
                set: function(value) {
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.cb.setStreetFull(value).then( function(value) {

                            if (ExtendableObject.active) {
                                ExtendableObject._localStreetFullState++;
                            }

                            if (
                                ExtendableObject.hasLoadedExtension('StreetNameExtension') &&
                                ExtendableObject.hasLoadedExtension('BuildingNumberExtension') &&
                                ['general_address', 'shipping_address', 'billing_address'].includes(ExtendableObject.addressType) &&
                                ExtendableObject._localStreetFullState > Math.max(ExtendableObject._localStreetNameState, ExtendableObject._localBuildingNumberState)
                            ) {
                                ExtendableObject.waitForActive().then(function() {
                                    ExtendableObject._awaits++;
                                    ExtendableObject.util.splitStreet(value).then(function(data) {
                                        ExtendableObject._awaits++;
                                        if (
                                            ExtendableObject.hasLoadedExtension('BuildingNumberExtension')
                                        ) {
                                            ExtendableObject.buildingNumber = data.result.houseNumber;
                                        }

                                        if (
                                            ExtendableObject.hasLoadedExtension('StreetNameExtension')
                                        ) {
                                            ExtendableObject.streetName = data.result.streetName;
                                        }

                                        ExtendableObject._awaits--;
                                    }).catch(function(e) {
                                        if (
                                            ExtendableObject.hasLoadedExtension('StreetNameExtension')
                                        ) {
                                            ExtendableObject.streetName = ExtendableObject.streetFull;
                                        }
                                        if (
                                            ExtendableObject.hasLoadedExtension('BuildingNumberExtension')
                                        ) {
                                            ExtendableObject.buildingNumber = '';
                                        }
                                    }).finally(function() {
                                        ExtendableObject._awaits--;
                                    })
                                }).catch();
                            }

                            var oldValue = ExtendableObject._streetFull;
                            var newValue = value;

                            var notSame = oldValue !== newValue;

                            // Chunk set.
                            if (ExtendableObject.hasLoadedExtension('StreetFullAutocompleteExtension')) {
                                notSame = notSame || ( ExtendableObject._streetFullChunk !== newValue );
                            }

                            if (notSame) {
                                ExtendableObject._streetFull = newValue;

                                if (ExtendableObject.hasLoadedExtension('StreetFullAutocompleteExtension')) {
                                    ExtendableObject._streetFullChunk = newValue;

                                    // Inform all subscribers about the change.
                                    ExtendableObject._subscribers.streetFullChunk.forEach(function (subscriber) {
                                        subscriber.updateValue(value, true);
                                    });
                                }

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.streetFull.forEach(function (subscriber) {
                                    subscriber.updateValue(newValue, true);
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

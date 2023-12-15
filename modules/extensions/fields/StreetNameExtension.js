var StreetNameExtension = {
    name: 'StreetNameExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject._streetName = '';
            ExtendableObject._subscribers.streetName = [];

            ExtendableObject._localStreetNameState = 1;

            ExtendableObject.cb.setStreetName = function(streetName) {
                return new ExtendableObject.util.Promise(function(resolve, reject) {
                    resolve(streetName);
                });
            };

            ExtendableObject.cb.streetNameChange = function(subscriber) {
                return function(e) {
                    ExtendableObject.streetName = subscriber.value;
                }
            };

            ExtendableObject.cb.streetNameBlur = function(subscriber) {
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

            // Add getter and setter for fields.
            Object.defineProperty(ExtendableObject, 'streetName', {
                get: function() {
                    return this._streetName;
                },
                set: function(value) {
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.cb.setStreetName(value).then( function(value) {

                            if (ExtendableObject.active) {
                                ExtendableObject._localStreetNameState++;
                            }

                            if (
                                ExtendableObject.active &&
                                ExtendableObject.hasLoadedExtension('StreetFullExtension') &&
                                ['general_address', 'shipping_address', 'billing_address'].includes(ExtendableObject.addressType) &&
                                ExtendableObject._localStreetNameState > ExtendableObject._localStreetFullState
                            ) {
                                ExtendableObject._localBuildingNumberState++;
                                ExtendableObject.streetFull = ExtendableObject.util.formatStreetFull(
                                    {
                                        countryCode: ExtendableObject.countryCode,
                                        streetName: value,
                                        buildingNumber: ExtendableObject.buildingNumber,
                                        additionalInfo: ExtendableObject.additionalInfo
                                    }
                                );
                            }

                            var oldValue = ExtendableObject._streetName;
                            var newValue = value;

                            var notSame = ExtendableObject._streetName !== value;

                            // Chunk set.
                            if (ExtendableObject.hasLoadedExtension('StreetNameAutocompleteExtension')) {
                                notSame = notSame || ( ExtendableObject._streetNameChunk !== value );
                            }

                            if (notSame) {
                                ExtendableObject._streetName = value;

                                if (ExtendableObject.hasLoadedExtension('StreetNameAutocompleteExtension')) {
                                    ExtendableObject._streetNameChunk = value;

                                    // Inform all subscribers about the change.
                                    ExtendableObject._subscribers.streetNameChunk.forEach(function (subscriber) {
                                        subscriber.updateValue(value, true);
                                    });
                                }

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.streetName.forEach(function (subscriber) {
                                    subscriber.updateValue(value, true);
                                });

                                if (ExtendableObject.active) {
                                    ExtendableObject.fire(
                                        new ExtendableObject.util.CustomEvent(
                                            'change',
                                            {
                                                detail: {
                                                    fieldName: 'streetName',
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
                                console.log('Error resolving streetName', e);
                            }
                        }).finally(function() {
                            ExtendableObject._awaits--;
                        });
                    }).catch().finally(function() {
                        ExtendableObject._awaits--;
                    });
                }
            });

            ExtendableObject.fieldNames.push('streetName');

            if (ExtendableObject.config.showDebugInfo) {
                console.log('StreetNameExtension applied');
            }

            resolve($self);
        });
    }
}

export default StreetNameExtension

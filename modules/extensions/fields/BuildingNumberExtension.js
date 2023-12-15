var BuildingNumberExtension = {
    name: 'BuildingNumberExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject._buildingNumber = '';
            ExtendableObject._subscribers.buildingNumber = [];
            ExtendableObject._localBuildingNumberState = 1;
            var $buildingNumberTimeout;

            ExtendableObject.cb.setBuildingNumber = function(buildingNumber) {
                return new ExtendableObject.util.Promise(function(resolve, reject) {
                    resolve(buildingNumber);
                });
            };

            ExtendableObject.cb.buildingNumberChange = function(subscriber) {
                return function(e) {
                    ExtendableObject._changed = true;
                    ExtendableObject.buildingNumber = subscriber.value;
                }
            };

            ExtendableObject.cb.buildingNumberInput = function(subscriber) {
                return function(e) {
                    ExtendableObject._changed = true;
                    ExtendableObject.buildingNumber = subscriber.value;
                    ExtendableObject.addressStatus = [];
                }
            };

            ExtendableObject.cb.buildingNumberBlur = function(subscriber) {
                return function(e) {
                    ExtendableObject.waitUntilReady().then(function() {

                        if (ExtendableObject.onBlurTimeout) {
                            clearTimeout(ExtendableObject.onBlurTimeout);
                            ExtendableObject.onBlurTimeout = null;
                        }
                        ExtendableObject.onBlurTimeout = setTimeout( function() {
                            if (ExtendableObject.config.trigger.onblur && !ExtendableObject.anyActive() && ExtendableObject.util.shouldBeChecked() && !window.EnderecoIntegrator.hasSubmit) {
                                // Second. Check Address.
                                ExtendableObject.onBlurTimeout = null;
                                ExtendableObject.util.checkAddress().catch();
                            }
                        }, 300);
                    }).catch()
                }
            };

            // Add getter and setter for fields.
            Object.defineProperty(ExtendableObject, 'buildingNumber', {
                get: function() {
                    return this._buildingNumber;
                },
                set: function(value) {
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.cb.setBuildingNumber(value).then( function(value) {
                            if (ExtendableObject.active) {
                                ExtendableObject._localBuildingNumberState++;
                            }

                            // Always update street full.
                            if (
                                ExtendableObject.active &&
                                ExtendableObject.hasLoadedExtension('StreetFullExtension') &&
                                ['general_address', 'shipping_address', 'billing_address'].includes(ExtendableObject.addressType) &&
                                ExtendableObject._localBuildingNumberState > ExtendableObject._localStreetFullState
                            ) {
                                ExtendableObject._localStreetNameState++;
                                ExtendableObject.streetFull = ExtendableObject.util.formatStreetFull(
                                    {
                                        countryCode: ExtendableObject.countryCode,
                                        streetName: ExtendableObject.streetName,
                                        buildingNumber: value,
                                        additionalInfo: ExtendableObject.additionalInfo
                                    }
                                );
                            }

                            var oldValue = ExtendableObject._buildingNumber;
                            var newValue = value;

                            var notSame = ExtendableObject._buildingNumber !== value;

                            if (notSame) {


                                ExtendableObject._buildingNumber = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.buildingNumber.forEach(function (subscriber) {
                                    subscriber.updateValue(value, true);
                                });

                                if (ExtendableObject.active) {
                                    ExtendableObject.fire(
                                        new ExtendableObject.util.CustomEvent(
                                            'change',
                                            {
                                                detail: {
                                                    fieldName: 'buildingNumber',
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
                                console.log('Error resolving buildingNumber', e);
                            }
                        }).finally(function() {
                            ExtendableObject._awaits--;
                        });
                    }).catch().finally(function() {
                        ExtendableObject._awaits--;
                    });
                }
            });

            ExtendableObject.fieldNames.push('buildingNumber');

            if (ExtendableObject.config.showDebugInfo) {
                console.log('BuildingNumberExtension applied');
            }

            resolve($self);
        });
    }
}

export default BuildingNumberExtension

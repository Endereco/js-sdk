var BuildingNumberExtension = {
    name: 'BuildingNumberExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject._buildingNumber = '';
            ExtendableObject._subscribers.buildingNumber = [];

            var $buildingNumberTimeout;

            ExtendableObject.cb.setBuildingNumber = function(buildingNumber) {
                return new ExtendableObject.util.Promise(function(resolve, reject) {
                    resolve(buildingNumber);
                });
            };

            ExtendableObject.cb.buildingNumberChange = function(subscriber) {
                return function(e) {
                    ExtendableObject.buildingNumber = subscriber.value;
                }
            };

            ExtendableObject.cb.buildingNumberInput = function(subscriber) {
                return function(e) {
                    ExtendableObject._changed = true;

                    if (!!$buildingNumberTimeout) {
                        clearTimeout($buildingNumberTimeout)
                    }

                    $buildingNumberTimeout = setTimeout( function() {
                        ExtendableObject.buildingNumber = subscriber.value;
                    }, 1500);
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
                            var oldValue = ExtendableObject._buildingNumber;
                            var newValue = value;

                            var notSame = ExtendableObject._buildingNumber !== value;

                            // Chunk set.
                            if (ExtendableObject.hasLoadedExtension('BuildingNumberAutocompleteExtension')) {
                                notSame = notSame || ( ExtendableObject._buildingNumberChunk !== value );
                            }

                            if (notSame) {
                                ExtendableObject._buildingNumber = value;

                                if (ExtendableObject.hasLoadedExtension('BuildingNumberAutocompleteExtension')) {
                                    ExtendableObject._buildingNumberChunk = value;
                                }


                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.buildingNumber.forEach(function (subscriber) {
                                    subscriber.value = value;
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

                                // If street full is set, generate full street and write it to it.
                                if (
                                    ExtendableObject.hasLoadedExtension('StreetFullExtension') &&
                                    ['general_address', 'shipping_address', 'billing_address'].includes(ExtendableObject.addressType)
                                ) {
                                    ExtendableObject.setField('streetFull', ExtendableObject.util.formatStreetFull(), false);
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

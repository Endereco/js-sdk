var SubdivisionCodeExtension = {
    name: 'SubdivisionCodeExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {
            // Add _address, _addressStatus.
            ExtendableObject._subdivisionCode = ''; // Germany is a preselected default.
            ExtendableObject._subscribers.subdivisionCode = [];

            ExtendableObject._localSubdivisionCodeState = 1;
            ExtendableObject._globalSubdivisionCodeState = 1;

            // Add a setter callback promise.
            ExtendableObject.cb.setSubdivisionCode = function(countryCode) {
                return new ExtendableObject.util.Promise(function(resolve, reject) {
                    resolve(countryCode);
                });
            };

            ExtendableObject.cb.subdivisionCodeChange = function(subscriber) {
                return function(e) {
                    ExtendableObject.subdivisionCode = subscriber.value;
                    if (ExtendableObject.active) {
                        ExtendableObject._changed = true;
                    }
                }
            };

            ExtendableObject.cb.subdivisionCodeInput = function(subscriber) {
                return function(e) {
                    ExtendableObject.subdivisionCode = subscriber.value;
                    if (ExtendableObject.active) {
                        ExtendableObject._changed = true;
                        ExtendableObject.addressStatus = [];
                    }
                }
            };

            ExtendableObject.cb.subdivisionCodeBlur = function(subscriber) {
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
            Object.defineProperty(ExtendableObject, 'subdivisionCode', {
                get: function() {
                    return this._subdivisionCode;
                },
                set: function(value) {
                    // value can be a string, array or promise.
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.cb.setSubdivisionCode(value).then( function(value) {
                            var oldValue = ExtendableObject._subdivisionCode;
                            var newValue = value.toUpperCase(); // Force normalize.
                            if (ExtendableObject._subdivisionCode !== value) {
                                ExtendableObject._subdivisionCode = value;

                                // Inform all subscribers about the change while updating their inner state.
                                ExtendableObject._subscribers.subdivisionCode.forEach(function (subscriber) {
                                    subscriber.updateValue(value, true);
                                });

                                // Fire change event for listeners.
                                if (ExtendableObject.active) {
                                    ExtendableObject.fire(
                                        new ExtendableObject.util.CustomEvent(
                                            'change',
                                            {
                                                detail: {
                                                    fieldName: 'subdivisionCode',
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
                                console.log('Error setting subdivisionCode', e);
                            }
                        }).finally(function() {
                            ExtendableObject._awaits--;
                        });
                    }).catch(function(e) {
                        if (ExtendableObject.config.showDebugInfo) {
                            console.log('Error setting subdivisionCode', e);
                        }
                    }).finally(function() {
                        ExtendableObject._awaits--;
                    });
                }
            });

            if (ExtendableObject.config.showDebugInfo) {
                console.log('SubdivisionCodeExtension applied');
            }

            // Add country code to field names list.
            ExtendableObject.fieldNames.push('subdivisionCode');

            resolve($self);
        });
    }
}

export default SubdivisionCodeExtension

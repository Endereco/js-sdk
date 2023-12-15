var PostalCodeExtension = {
    name: 'PostalCodeExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject._postalCode = '';
            ExtendableObject._subscribers.postalCode = [];

            ExtendableObject.cb.setPostalCode = function(postalCode) {
                return new ExtendableObject.util.Promise(function(resolve, reject) {
                    resolve(postalCode);
                });
            };

            ExtendableObject.cb.postalCodeChange = function(subscriber) {
                return function(e) {
                    ExtendableObject.postalCode = subscriber.value;
                }
            };

            ExtendableObject.cb.postalCodeBlur = function(subscriber) {
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
            Object.defineProperty(ExtendableObject, 'postalCode', {
                get: function() {
                    return this._postalCode;
                },
                set: function(value) {
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.cb.setPostalCode(value).then( function(value) {
                            var oldValue = ExtendableObject._postalCode;
                            var newValue = value;

                            var notSame = ExtendableObject._postalCode !== value;

                            // Chunk set.
                            if (ExtendableObject.hasLoadedExtension('PostalCodeAutocompleteExtension')) {
                                notSame = notSame || ( ExtendableObject._postalCodeChunk !== value );
                            }

                            if (notSame) {
                                ExtendableObject._postalCode = value;

                                if (ExtendableObject.hasLoadedExtension('PostalCodeAutocompleteExtension')) {
                                    ExtendableObject._postalCodeChunk = value;

                                    // Inform all subscribers about the change.
                                    ExtendableObject._subscribers.postalCodeChunk.forEach(function (subscriber) {
                                        subscriber.updateValue(value, true);
                                    });
                                }


                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.postalCode.forEach(function (subscriber) {
                                    subscriber.updateValue(value, true);
                                });

                                if (ExtendableObject.active) {
                                    ExtendableObject.fire(
                                        new ExtendableObject.util.CustomEvent(
                                            'change',
                                            {
                                                detail: {
                                                    fieldName: 'postalCode',
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
                                console.log('Error resolving postalCode', e);
                            }
                        }).finally(function() {
                            ExtendableObject._awaits--;
                        });
                    }).catch().finally(function() {
                        ExtendableObject._awaits--;
                    });
                }
            });

            ExtendableObject.fieldNames.push('postalCode');

            if (ExtendableObject.config.showDebugInfo) {
                console.log('PostalCodeExtension applied');
            }

            resolve($self);
        });
    }
}

export default PostalCodeExtension

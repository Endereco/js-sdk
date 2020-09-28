var LocalityExtension = {
    name: 'LocalityExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject._locality = '';
            ExtendableObject._subscribers.locality = [];

            ExtendableObject.cb.setLocality = function(locality) {
                return new ExtendableObject.util.Promise(function(resolve, reject) {
                    resolve(locality);
                });
            };

            ExtendableObject.cb.localityChange = function(subscriber) {
                return function(e) {
                    ExtendableObject.locality = subscriber.value;
                }
            };

            ExtendableObject.cb.localityBlur = function(subscriber) {
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
            Object.defineProperty(ExtendableObject, 'locality', {
                get: function() {
                    return this._locality;
                },
                set: function(value) {
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.cb.setLocality(value).then( function(value) {
                            var oldValue = ExtendableObject._locality;
                            var newValue = value;

                            var notSame = ExtendableObject._locality !== value;

                            // Chunk set.
                            if (ExtendableObject.hasLoadedExtension('LocalityAutocompleteExtension')) {
                                notSame = notSame || ( ExtendableObject._localityChunk !== value );
                            }

                            if (notSame) {
                                ExtendableObject._locality = value;

                                if (ExtendableObject.hasLoadedExtension('LocalityAutocompleteExtension')) {
                                    ExtendableObject._localityChunk = value;
                                }


                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.locality.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                if (ExtendableObject.active) {
                                    ExtendableObject.fire(
                                        new ExtendableObject.util.CustomEvent(
                                            'change',
                                            {
                                                detail: {
                                                    fieldName: 'locality',
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
                                console.log('Error resolving locality', e);
                            }
                        }).finally(function() {
                            ExtendableObject._awaits--;
                        });
                    }).catch().finally(function() {
                        ExtendableObject._awaits--;
                    });
                }
            });

            ExtendableObject.fieldNames.push('locality');

            if (ExtendableObject.config.showDebugInfo) {
                console.log('LocalityExtension applied');
            }

            resolve($self);
        });
    }
}

export default LocalityExtension

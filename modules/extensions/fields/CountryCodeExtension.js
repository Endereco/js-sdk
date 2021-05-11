var CountryCodeExtension = {
    name: 'CountryCodeExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {
            // Add _address, _addressStatus.
            ExtendableObject._countryCode = ''; // Germany is a preselected default.
            ExtendableObject._subscribers.countryCode = [];

            // Add a setter callback promise.
            ExtendableObject.cb.setCountryCode = function(countryCode) {
                return new ExtendableObject.util.Promise(function(resolve, reject) {
                    resolve(countryCode);
                });
            };

            ExtendableObject.cb.countryCodeChange = function(subscriber) {
                return function(e) {
                    ExtendableObject.countryCode = subscriber.value;
                }
            };

            ExtendableObject.cb.countryCodeBlur = function(subscriber) {
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
            Object.defineProperty(ExtendableObject, 'countryCode', {
                get: function() {
                    return this._countryCode;
                },
                set: function(value) {
                    // value can be a string, array or promise.
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.cb.setCountryCode(value).then( function(value) {
                            var oldValue = ExtendableObject._countryCode;
                            var newValue = value;
                            if (ExtendableObject._countryCode !== value) {
                                ExtendableObject._countryCode = value;
                                ExtendableObject._changed = true;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.countryCode.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                // Fire change event for listeners.
                                if (ExtendableObject.active) {
                                    ExtendableObject.fire(
                                        new ExtendableObject.util.CustomEvent(
                                            'change',
                                            {
                                                detail: {
                                                    fieldName: 'countryCode',
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
                                console.log('Error setting countryCode', e);
                            }
                        }).finally(function() {
                            ExtendableObject._awaits--;
                        });
                    }).catch(function(e) {
                        if (ExtendableObject.config.showDebugInfo) {
                            console.log('Error setting countryCode', e);
                        }
                    }).finally(function() {
                        ExtendableObject._awaits--;
                    });
                }
            });

            if (ExtendableObject.config.showDebugInfo) {
                console.log('CountryCodeExtension applied');
            }

            // Add country code to field names list.
            ExtendableObject.fieldNames.push('countryCode');

            resolve($self);
        });
    }
}

export default CountryCodeExtension

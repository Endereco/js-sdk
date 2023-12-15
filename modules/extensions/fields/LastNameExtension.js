var LastNameExtension = {
    name: 'LastNameExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {

            // Add email field.
            ExtendableObject._lastName = '';
            ExtendableObject._subscribers.lastName = [];

            // Add change event hadler.
            ExtendableObject.cb.lastNameBlur = function(subscriber) {
                return function(e) {
                    ExtendableObject.lastName = subscriber.value;
                    ExtendableObject.waitUntilReady().then(function() {

                        if (ExtendableObject.onBlurTimeout) {
                            clearTimeout(ExtendableObject.onBlurTimeout);
                            ExtendableObject.onBlurTimeout = null;
                        }
                        ExtendableObject.onBlurTimeout = setTimeout( function() {
                            if (!ExtendableObject.anyActive() && ExtendableObject.util.shouldBeChecked() && !window.EnderecoIntegrator.hasSubmit) {
                                // Second. Check Address.
                                ExtendableObject.onBlurTimeout = null;
                                ExtendableObject.util.checkPerson()
                                    .catch()
                                    .finally(() => {
                                        ExtendableObject._changed = false;
                                    });
                            }
                        }, 300);
                    }).catch()
                }
            };

            // Add the "emaiL" property
            Object.defineProperty(ExtendableObject, 'lastName', {
                get: function() {
                    return this._lastName;
                },
                set: function(value) {
                    var oldValue = ExtendableObject._lastName;
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        var newValue = value;
                        if (oldValue !== newValue) {
                            ExtendableObject._lastName = newValue;
                            ExtendableObject._changed = true;

                            // Inform all subscribers about the change.
                            ExtendableObject._subscribers.lastName.forEach(function (subscriber) {
                                subscriber.value = value;
                            });

                            // Fire change event for listeners.
                            if (ExtendableObject.active) {
                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'lastName',
                                                oldValue: oldValue,
                                                newValue: newValue,
                                                object: ExtendableObject
                                            }
                                        }
                                    )
                                );
                            }
                        }
                    }).catch().finally(function() {
                        ExtendableObject._awaits--;
                    });
                }
            });

            ExtendableObject.fieldNames.push('lastName');

            if (ExtendableObject.config.showDebugInfo) {
                console.log('LastNameExtension applied');
            }

            resolve($self);
        });
    }
}

export default LastNameExtension

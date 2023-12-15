var FirstNameExtension = {
    name: 'FirstNameExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {

            // Add email field.
            ExtendableObject._firstName = '';
            ExtendableObject._subscribers.firstName = [];

            // Add change event hadler.
            ExtendableObject.cb.firstNameBlur = function(subscriber) {
                return function(e) {
                    ExtendableObject.firstName = subscriber.value;
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
            Object.defineProperty(ExtendableObject, 'firstName', {
                get: function() {
                    return this._firstName;
                },
                set: function(value) {
                    var oldValue = ExtendableObject._firstName;
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        var newValue = value;
                        if (oldValue !== newValue) {
                            ExtendableObject._firstName = newValue;
                            ExtendableObject._changed = true;

                            // Inform all subscribers about the change.
                            ExtendableObject._subscribers.firstName.forEach(function (subscriber) {
                                subscriber.value = value;
                            });

                            // Fire change event for listeners.
                            if (ExtendableObject.active) {
                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'firstName',
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

            ExtendableObject.fieldNames.push('firstName');

            if (ExtendableObject.config.showDebugInfo) {
                console.log('FirstNameExtension applied');
            }

            resolve($self);
        });
    }
}

export default FirstNameExtension

var SalutationExtension = {
    name: 'SalutationExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {

            // Add email field.
            ExtendableObject._salutation = '';
            ExtendableObject._subscribers.salutation = [];

            // Add change event hadler.
            ExtendableObject.cb.salutationChange = function(subscriber) {
                return function(e) {
                    ExtendableObject.salutation = subscriber.value;
                    ExtendableObject.waitUntilReady().then(function() {

                        if (ExtendableObject.onBlurTimeout) {
                            clearTimeout(ExtendableObject.onBlurTimeout);
                            ExtendableObject.onBlurTimeout = null;
                        }
                        ExtendableObject.onBlurTimeout = setTimeout( function() {
                            if (ExtendableObject.config.trigger.onblur && !ExtendableObject.anyActive() && ExtendableObject.util.shouldBeChecked() && !window.EnderecoIntegrator.hasSubmit) {
                                // Second. Check Address.
                                ExtendableObject.onBlurTimeout = null;
                                ExtendableObject.util.checkPerson().catch();
                            }
                        }, 300);
                    }).catch()
                }
            };

            // Add the "salutation" property
            Object.defineProperty(ExtendableObject, 'salutation', {
                get: function() {
                    return this._salutation;
                },
                set: function(value) {
                    var oldValue = ExtendableObject._salutation;
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        var newValue = value;
                        if (oldValue !== newValue) {
                            ExtendableObject._salutation = newValue;
                            ExtendableObject._changed = true;

                            // Inform all subscribers about the change.
                            ExtendableObject._subscribers.salutation.forEach(function (subscriber) {
                                subscriber.value = value;
                            });

                            // Fire change event for listeners.
                            if (ExtendableObject.active) {
                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'salutation',
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

            ExtendableObject.fieldNames.push('salutation');

            if (ExtendableObject.config.showDebugInfo) {
                console.log('SalutationExtension applied');
            }

            resolve($self);
        });
    }
}

export default SalutationExtension

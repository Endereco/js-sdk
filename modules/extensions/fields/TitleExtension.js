var TitleExtension = {
    name: 'TitleExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {

            // Add email field.
            ExtendableObject._title = '';
            ExtendableObject._subscribers.title = [];

            // Add change event hadler.
            ExtendableObject.cb.titleBlur = function(subscriber) {
                return function(e) {
                    ExtendableObject.title = subscriber.value;
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

            // Add the "emaiL" property
            Object.defineProperty(ExtendableObject, 'title', {
                get: function() {
                    return this._title;
                },
                set: function(value) {
                    var oldValue = ExtendableObject._title;
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        var newValue = value;
                        if (oldValue !== newValue) {
                            ExtendableObject._title = newValue;
                            ExtendableObject._changed = true;

                            // Inform all subscribers about the change.
                            ExtendableObject._subscribers.title.forEach(function (subscriber) {
                                subscriber.value = value;
                            });

                            // Fire change event for listeners.
                            if (ExtendableObject.active) {
                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'title',
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

            ExtendableObject.fieldNames.push('title');

            if (ExtendableObject.config.showDebugInfo) {
                console.log('TitleExtension applied');
            }

            resolve($self);
        });
    }
}

export default TitleExtension

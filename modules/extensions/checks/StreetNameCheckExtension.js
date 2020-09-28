var StreetNameCheckExtension = {
    name: 'StreetNameCheckExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('StreetNameExtension').then(function() {
                // Add email field.
                ExtendableObject._streetNameStatus = '';
                ExtendableObject._subscribers.streetNameStatus = [];

                // Add change event hadler.
                ExtendableObject.cb.streetNameStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.streetNameStatus = subscriber.value;
                    }
                };

                // Add the "emaiL" property
                Object.defineProperty(ExtendableObject, 'streetNameStatus', {
                    get: function() {
                        return this._streetNameStatus;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._streetNameStatus;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = value;
                            if (oldValue !== newValue) {
                                ExtendableObject._streetNameStatus = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.streetNameStatus.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'streetNameStatus',
                                                oldValue: oldValue,
                                                newValue: newValue,
                                                object: ExtendableObject
                                            }
                                        }
                                    )
                                );
                            }
                        }).catch().finally(function() {
                            ExtendableObject._awaits--;
                        });
                    }
                });

                if (ExtendableObject.config.showDebugInfo) {
                    console.log('StreetNameCheckExtension applied');
                }

                resolve($self);
            }).catch(function() {
                console.log('Failed to load because of timeout');
                reject($self);
            })

        });
    }
}

export default StreetNameCheckExtension

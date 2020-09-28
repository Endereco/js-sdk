var StreetFullCheckExtension = {
    name: 'StreetFullCheckExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('StreetFullExtension').then(function() {
                // Add email field.
                ExtendableObject._streetFullStatus = '';
                ExtendableObject._subscribers.streetFullStatus = [];

                // Add change event hadler.
                ExtendableObject.cb.streetFullStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.streetFullStatus = subscriber.value;
                    }
                };

                // Add the "emaiL" property
                Object.defineProperty(ExtendableObject, 'streetFullStatus', {
                    get: function() {
                        return this._streetFullStatus;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._streetFullStatus;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = value;
                            if (oldValue !== newValue) {
                                ExtendableObject._streetFullStatus = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.streetFullStatus.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'streetFullStatus',
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
                    console.log('StreetFullCheckExtension applied');
                }

                resolve($self);
            }).catch(function() {
                console.log('Failed to load because of timeout');
                reject($self);
            })

        });
    }
}

export default StreetFullCheckExtension

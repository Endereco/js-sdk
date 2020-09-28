var LocalityCheckExtension = {
    name: 'LocalityCheckExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('LocalityExtension').then(function() {
                // Add email field.
                ExtendableObject._localityStatus = '';
                ExtendableObject._subscribers.localityStatus = [];

                // Add change event hadler.
                ExtendableObject.cb.localityStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.localityStatus = subscriber.value;
                    }
                };

                // Add the "emaiL" property
                Object.defineProperty(ExtendableObject, 'localityStatus', {
                    get: function() {
                        return this._localityStatus;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._localityStatus;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = value;
                            if (oldValue !== newValue) {
                                ExtendableObject._localityStatus = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.localityStatus.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'localityStatus',
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
                    console.log('LocalityCheckExtension applied');
                }

                resolve($self);
            }).catch(function() {
                console.log('Failed to load because of timeout');
                reject($self);
            })

        });
    }
}

export default LocalityCheckExtension

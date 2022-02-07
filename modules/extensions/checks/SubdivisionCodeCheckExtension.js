var SubdivisionCodeCheckExtension = {
    name: 'SubdivisionCodeCheckExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('SubdivisionCodeExtension').then(function() {
                // Add email field.
                ExtendableObject._subdivisionCodeStatus = '';
                ExtendableObject._subscribers.subdivisionCodeStatus = [];

                // Add change event hadler.
                ExtendableObject.cb.subdivisionCodeStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.subdivisionCodeStatus = subscriber.value;
                    }
                };

                // Add the "emaiL" property
                Object.defineProperty(ExtendableObject, 'subdivisionCodeStatus', {
                    get: function() {
                        return this._subdivisionCodeStatus;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._subdivisionCodeStatus;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = value;
                            if (oldValue !== newValue) {
                                ExtendableObject._subdivisionCodeStatus = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.subdivisionCodeStatus.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'subdivisionCodeStatus',
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
                    console.log('SubdivisionCodeCheckExtension applied');
                }

                resolve($self);
            }).catch(function() {
                console.log('Failed to load because of timeout');
                reject($self);
            })

        });
    }
}

export default SubdivisionCodeCheckExtension

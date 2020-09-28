var PostalCodeCheckExtension = {
    name: 'PostalCodeCheckExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('PostalCodeExtension').then(function() {
                // Add email field.
                ExtendableObject._postalCodeStatus = '';
                ExtendableObject._subscribers.postalCodeStatus = [];

                // Add change event hadler.
                ExtendableObject.cb.postalCodeStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.postalCodeStatus = subscriber.value;
                    }
                };

                // Add the "emaiL" property
                Object.defineProperty(ExtendableObject, 'postalCodeStatus', {
                    get: function() {
                        return this._postalCodeStatus;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._postalCodeStatus;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = value;
                            if (oldValue !== newValue) {
                                ExtendableObject._postalCodeStatus = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.postalCodeStatus.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'postalCodeStatus',
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
                    console.log('PostalCodeCheckExtension applied');
                }

                resolve($self);
            }).catch(function() {
                console.log('Failed to load because of timeout');
                reject($self);
            })

        });
    }
}

export default PostalCodeCheckExtension

var CountryCodeCheckExtension = {
    name: 'CountryCodeCheckExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('CountryCodeExtension').then(function() {
                // Add email field.
                ExtendableObject._countryCodeStatus = '';
                ExtendableObject._subscribers.countryCodeStatus = [];

                // Add change event hadler.
                ExtendableObject.cb.countryCodeStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.countryCodeStatus = subscriber.value;
                    }
                };

                // Add the "emaiL" property
                Object.defineProperty(ExtendableObject, 'countryCodeStatus', {
                    get: function() {
                        return this._countryCodeStatus;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._countryCodeStatus;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = value;
                            if (oldValue !== newValue) {
                                ExtendableObject._countryCodeStatus = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.countryCodeStatus.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'countryCodeStatus',
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
                    console.log('CountryCodeCheckExtension applied');
                }

                resolve($self);
            }).catch(function() {
                console.log('Failed to load because of timeout');
                reject($self);
            })

        });
    }
}

export default CountryCodeCheckExtension

var AddressExtension = {
    name: 'AddressExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension([
                'CountryCodeExtension',
                'PostalCodeExtension',
                'LocalityExtension',
                'StreetNameExtension',
                'BuildingNumberExtension',
                'AdditionalInfoExtension'
            ]).then(function() {
                ExtendableObject._subscribers.address = [];

                ExtendableObject.cb.setAddress = function(address) {
                    return new ExtendableObject.util.Promise(function(resolve, reject) {
                        resolve(address);
                    });
                };

                ExtendableObject.cb.addressChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.address = subscriber.value;
                    }
                };

                // Add getter and setter for fields.
                Object.defineProperty(ExtendableObject, 'address', {
                    get: function() {
                        var $address = {};
                        ExtendableObject.fieldNames.forEach(function(fieldName) {
                            $address[fieldName] = ExtendableObject[fieldName];
                        })
                        return $address;
                    },
                    set: function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            ExtendableObject._awaits++;
                            ExtendableObject.cb.setAddress(value).then( function(value) {
                                // TODO: parse and set address
                            }).catch(function(e) {
                                if (ExtendableObject.config.showDebugInfo) {
                                    console.log('Error resolving address', e);
                                }
                            }).finally(function() {
                                ExtendableObject._awaits--;
                            });
                        }).catch().finally(function() {
                            ExtendableObject._awaits--;
                        });
                    }
                });

                if (ExtendableObject.config.showDebugInfo) {
                    console.log('AddressExtension applied');
                }

                resolve($self);
            }).catch();

        });
    }
}

export default AddressExtension

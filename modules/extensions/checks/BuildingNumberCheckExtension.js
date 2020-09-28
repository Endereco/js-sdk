var BuildingNumberCheckExtension = {
    name: 'BuildingNumberCheckExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('BuildingNumberExtension').then(function() {
                // Add email field.
                ExtendableObject._buildingNumberStatus = '';
                ExtendableObject._subscribers.buildingNumberStatus = [];

                // Add change event hadler.
                ExtendableObject.cb.buildingNumberStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.buildingNumberStatus = subscriber.value;
                    }
                };

                // Add the "emaiL" property
                Object.defineProperty(ExtendableObject, 'buildingNumberStatus', {
                    get: function() {
                        return this._buildingNumberStatus;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._buildingNumberStatus;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = value;
                            if (oldValue !== newValue) {
                                ExtendableObject._buildingNumberStatus = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.buildingNumberStatus.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'buildingNumberStatus',
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
                    console.log('BuildingNumberCheckExtension applied');
                }

                resolve($self);
            }).catch(function() {
                console.log('Failed to load because of timeout');
                reject($self);
            })

        });
    }
}

export default BuildingNumberCheckExtension

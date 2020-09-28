var AdditionalInfoCheckExtension = {
    name: 'AdditionalInfoCheckExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('AdditionalInfoExtension').then(function() {
                // Add email field.
                ExtendableObject._additionalInfoStatus = '';
                ExtendableObject._subscribers.additionalInfoStatus = [];

                // Add change event hadler.
                ExtendableObject.cb.additionalInfoStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.additionalInfoStatus = subscriber.value;
                    }
                };

                // Add the "emaiL" property
                Object.defineProperty(ExtendableObject, 'additionalInfoStatus', {
                    get: function() {
                        return this._additionalInfoStatus;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._additionalInfoStatus;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = value;
                            if (oldValue !== newValue) {
                                ExtendableObject._additionalInfoStatus = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.additionalInfoStatus.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'additionalInfoStatus',
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
                    console.log('AdditionalInfoCheckExtension applied');
                }

                resolve($self);
            }).catch(function() {
                console.log('Failed to load because of timeout');
                reject($self);
            })

        });
    }
}

export default AdditionalInfoCheckExtension

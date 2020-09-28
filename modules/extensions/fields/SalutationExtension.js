var SalutationExtension = {
    name: 'SalutationExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {

            // Add email field.
            ExtendableObject._salutation = '';
            ExtendableObject._subscribers.salutation = [];

            // Add change event hadler.
            ExtendableObject.cb.salutationChange = function(subscriber) {
                return function(e) {
                    ExtendableObject.salutation = subscriber.value;
                }
            };

            // Add the "salutation" property
            Object.defineProperty(ExtendableObject, 'salutation', {
                get: function() {
                    return this._salutation;
                },
                set: function(value) {
                    var oldValue = ExtendableObject._salutation;
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        var newValue = value;
                        if (oldValue !== newValue) {
                            ExtendableObject._salutation = newValue;
                            ExtendableObject._changed = true;

                            // Inform all subscribers about the change.
                            ExtendableObject._subscribers.salutation.forEach(function (subscriber) {
                                subscriber.value = value;
                            });

                            // Fire change event for listeners.
                            if (ExtendableObject.active) {
                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'salutation',
                                                oldValue: oldValue,
                                                newValue: newValue,
                                                object: ExtendableObject
                                            }
                                        }
                                    )
                                );
                            }

                            // Check address, if the extension is loaded.
                            if (ExtendableObject.active && ExtendableObject.hasLoadedExtension('SalutationCheckExtension')) {
                                ExtendableObject._awaits++;
                                ExtendableObject.util.checkSalutation().then(function(data) {
                                    if (data.gender === ExtendableObject.salutation) {
                                        ExtendableObject.salutationStatus = ['salutation_correct']
                                    } else if(
                                        ['M','F'].includes(data.gender) &&
                                        ['M','F'].includes(ExtendableObject.salutation) &&
                                        data.gender !== ExtendableObject.salutation
                                    ) {
                                        ExtendableObject.salutationStatus = ['salutation_not_correct']
                                    } else if(
                                        'N' === data.gender &&
                                        '' !== ExtendableObject.salutation
                                    ) {
                                        ExtendableObject.salutationStatus = ['salutation_correct']
                                    } else {
                                        ExtendableObject.salutationStatus = [];
                                    }

                                    if (!ExtendableObject.salutation && ['M','F'].includes(data.gender)) {
                                        ExtendableObject.salutation = data.gender;
                                    }
                                }).catch(function(e) {
                                    console.log('Failed checking email', e, ExtendableObject);
                                }).finally(function() {
                                    ExtendableObject._awaits--;
                                })
                            }
                        }
                    }).catch().finally(function() {
                        ExtendableObject._awaits--;
                    });

                }
            });

            ExtendableObject.fieldNames.push('salutation');

            if (ExtendableObject.config.showDebugInfo) {
                console.log('SalutationExtension applied');
            }

            resolve($self);
        });
    }
}

export default SalutationExtension

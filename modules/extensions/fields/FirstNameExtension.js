var FirstNameExtension = {
    name: 'FirstNameExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {

            // Add email field.
            ExtendableObject._firstName = '';
            ExtendableObject._subscribers.firstName = [];

            // Add change event hadler.
            ExtendableObject.cb.firstNameChange = function(subscriber) {
                return function(e) {
                    ExtendableObject.firstName = subscriber.value;
                }
            };

            // Add the "emaiL" property
            Object.defineProperty(ExtendableObject, 'firstName', {
                get: function() {
                    return this._firstName;
                },
                set: function(value) {
                    var oldValue = ExtendableObject._firstName;
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        var newValue = value;
                        if (oldValue !== newValue) {
                            ExtendableObject._firstName = newValue;
                            ExtendableObject._changed = true;

                            // Inform all subscribers about the change.
                            ExtendableObject._subscribers.firstName.forEach(function (subscriber) {
                                subscriber.value = value;
                            });

                            // Fire change event for listeners.
                            if (ExtendableObject.active) {
                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'firstName',
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
                                    console.log('Failed checking', e, ExtendableObject);
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

            ExtendableObject.fieldNames.push('firstName');

            ExtendableObject.addEventListener('change', function(e) {
                if (e.fieldName && 'firstName' === e.fieldName) {
                    ExtendableObject.firstName = ExtendableObject.firstName[0].toUpperCase() + ExtendableObject.firstName.slice(1);
                }
            });



            if (ExtendableObject.config.showDebugInfo) {
                console.log('FirstNameExtension applied');
            }

            resolve($self);
        });
    }
}

export default FirstNameExtension

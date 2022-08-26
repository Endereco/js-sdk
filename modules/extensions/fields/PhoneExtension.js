
var PhoneExtension = {
    name: 'PhoneExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject._phone = '';
            ExtendableObject._subscribers.phone = [];

            ExtendableObject.cb.setPhone = function(phone) {
                return new ExtendableObject.util.Promise(function(resolve, reject) {
                    resolve(phone);
                });
            };

            ExtendableObject.cb.phoneChange = function(subscriber) {
                return function(e) {
                    ExtendableObject.phone = subscriber.value;
                }
            };

            ExtendableObject.cb.phoneBlur = function(subscriber) {
                return function(e) {
                    ExtendableObject.waitUntilReady().then(function() {

                        if (ExtendableObject.onBlurTimeout) {
                            clearTimeout(ExtendableObject.onBlurTimeout);
                            ExtendableObject.onBlurTimeout = null;
                        }
                        ExtendableObject.onBlurTimeout = setTimeout( function() {
                            var newStatus;
                            if (!ExtendableObject.anyActive() && ExtendableObject.util.shouldBeChecked() && !window.EnderecoIntegrator.hasSubmit) {
                                // Second. Check Address.
                                clearTimeout(ExtendableObject.onBlurTimeout);
                                ExtendableObject.onBlurTimeout = null;

                                if (ExtendableObject.active && ExtendableObject.hasLoadedExtension('PhoneCheckExtension')) {
                                    ExtendableObject._awaits++;
                                    ExtendableObject.phoneStatus = [];
                                    ExtendableObject.util.checkPhone().then(function(data) {
                                        // If format is defined, rewrite field.
                                        if (ExtendableObject.config.phoneFormat) {
                                            if (data.status.includes('phone_format_needs_correction')) {
                                                newStatus = data.status;

                                                newStatus.push('phone_correct');
                                                newStatus.push('phone_format_'+ExtendableObject.config.phoneFormat.toLowerCase());

                                                if (newStatus.indexOf('phone_format_unknown') !== -1) {
                                                    newStatus.splice(
                                                        newStatus.indexOf('phone_format_unknown'),
                                                        1
                                                    );
                                                }

                                                if (newStatus.indexOf('phone_format_needs_correction') !== -1) {
                                                    newStatus.splice(
                                                        newStatus.indexOf('phone_format_needs_correction'),
                                                        1
                                                    );
                                                }

                                                if (newStatus.indexOf('phone_needs_correction') !== -1) {
                                                    newStatus.splice(
                                                        newStatus.indexOf('phone_needs_correction'),
                                                        1
                                                    );
                                                }

                                                ExtendableObject.phone = data.predictions[0].phone;
                                                ExtendableObject.phoneStatus = newStatus;
                                            } else {
                                                ExtendableObject.phoneStatus = data.status;
                                            }
                                        } else {
                                            ExtendableObject.phoneStatus = data.status;
                                        }

                                    }).catch(function(e) {
                                        ExtendableObject.phoneStatus = [];
                                        console.log('Failed checking phone', e, ExtendableObject);
                                    }).finally(function() {
                                        ExtendableObject._awaits--;
                                    })
                                }
                            }
                        }, 300);
                    }).catch()
                }
            };

            // Add getter and setter for fields.
            Object.defineProperty(ExtendableObject, 'phone', {
                get: function() {
                    return this._phone;
                },
                set: function(value) {
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.cb.setPhone(value).then( function(value) {
                            var oldValue = ExtendableObject._phone;
                            var newValue = value;

                            var notSame = oldValue !== newValue;

                            if (notSame) {
                                ExtendableObject._phone = newValue;
                                ExtendableObject._changed = true;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.phone.forEach(function (subscriber) {
                                    subscriber.value = newValue;
                                });

                                if (ExtendableObject.active) {
                                    ExtendableObject.fire(
                                        new ExtendableObject.util.CustomEvent(
                                            'change',
                                            {
                                                detail: {
                                                    fieldName: 'phone',
                                                    oldValue: oldValue,
                                                    newValue: newValue,
                                                    object: ExtendableObject
                                                }
                                            }
                                        )
                                    );
                                }
                            }

                        }).catch(function(e) {
                            if (ExtendableObject.config.showDebugInfo) {
                                console.log('Error resolving phoneFull', e);
                            }
                        }).finally(function() {
                            ExtendableObject._awaits--;
                        });
                    }).catch().finally(function() {
                        ExtendableObject._awaits--;
                    });
                }
            });

            ExtendableObject.fieldNames.push('phone');

            if (ExtendableObject.config.showDebugInfo) {
                console.log('PhoneExtension applied');
            }

            resolve($self);
        });
    }
}

export default PhoneExtension

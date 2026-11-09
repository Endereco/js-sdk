const EmailExtension = {
    name: 'EmailExtension',
    extend: function (ExtendableObject) {
        const $self = this;

        return new ExtendableObject.util.Promise(function (resolve, reject) {
            // Add email field.
            ExtendableObject._email = '';
            ExtendableObject._subscribers.email = [];

            // Add change event hadler.
            ExtendableObject.cb.emailChange = function (subscriber) {
                return function (e) {
                    ExtendableObject.email = subscriber.value;
                };
            };

            // Add the "emaiL" property
            Object.defineProperty(ExtendableObject, 'email', {
                get: function () {
                    return this._email;
                },
                set: function (value) {
                    const oldValue = ExtendableObject._email;

                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function (value) {
                        const newValue = value;

                        if (oldValue !== newValue) {
                            ExtendableObject._email = newValue;
                            ExtendableObject._changed = true;

                            // Inform all subscribers about the change.
                            ExtendableObject._subscribers.email.forEach(function (subscriber) {
                                subscriber.value = value;
                            });

                            // Fire change event for listeners.
                            ExtendableObject.fire(
                                new ExtendableObject.util.CustomEvent(
                                    'change',
                                    {
                                        detail: {
                                            fieldName: 'email',
                                            oldValue,
                                            newValue,
                                            object: ExtendableObject
                                        }
                                    }
                                )
                            );

                            // Check address, if the extension is loaded.
                            if (ExtendableObject.active && ExtendableObject.hasLoadedExtension('EmailCheckExtension')) {
                                ExtendableObject._awaits++;
                                if (value.trim() === '') {
                                    ExtendableObject.emailStatus = [];
                                } else {
                                    ExtendableObject.util.checkEmail().then(function (data) {
                                        ExtendableObject.emailStatus = Array.isArray(data.status) ? data.status : [];
                                    }).catch(function (e) {
                                        ExtendableObject.emailStatus = [];
                                        console.log('Failed checking email', e, ExtendableObject);
                                    }).finally(function () {
                                        ExtendableObject._awaits--;
                                        ExtendableObject._changed = false;
                                    });
                                }
                            }
                        }
                    }).catch().finally(function () {
                        ExtendableObject._awaits--;
                    });
                }
            });

            ExtendableObject.fieldNames.push('email');

            if (ExtendableObject.config.showDebugInfo) {
                console.log('EmailExtension applied');
            }

            resolve($self);
        });
    }
};

export default EmailExtension;

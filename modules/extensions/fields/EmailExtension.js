const EmailExtension = {
    name: 'EmailExtension',
    extend: function (ExtendableObject) {
        const $self = this;

        return new ExtendableObject.util.Promise(function (resolve, reject) {
            // Add email field.
            ExtendableObject._email = '';
            ExtendableObject._subscribers.email = [];

            // Clears the email check result, unless it is already empty.
            const resetEmailStatus = function () {
                if (!ExtendableObject.active || !ExtendableObject.hasLoadedExtension('EmailCheckExtension')) {
                    return;
                }

                const status = ExtendableObject.emailStatus;

                if (!status || status.length === 0) {
                    return;
                }

                ExtendableObject.emailStatus = [];
            };

            // Value changed without focus (e.g. autofill): take it over, the setter checks it.
            ExtendableObject.cb.emailChange = function (subscriber) {
                return function () {
                    resetEmailStatus();
                    ExtendableObject.email = subscriber.value;
                };
            };

            // While typing only the status is reset. Taking over the value here would make the
            // setter check the email on every keystroke, so this is done on blur.
            ExtendableObject.cb.emailInput = function () {
                return resetEmailStatus;
            };

            ExtendableObject.cb.emailBlur = function (subscriber) {
                return function () {
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

                            // Check the email, if the extension is loaded and there is something to check.
                            if (ExtendableObject.active &&
                                ExtendableObject.hasLoadedExtension('EmailCheckExtension') &&
                                value.trim() !== ''
                            ) {
                                ExtendableObject._awaits++;
                                ExtendableObject.util.checkEmail().then(function (data) {
                                    // The API still sends the legacy code A1000 alongside email_correct when the
                                    // extended check is disabled. Drop legacy A-codes until the API stops sending them.
                                    ExtendableObject.emailStatus = Array.isArray(data.status)
                                        ? data.status.filter(function (code) {
                                            return !/^A\d{4}$/.test(code);
                                        })
                                        : [];
                                }).catch(function (e) {
                                    ExtendableObject.emailStatus = [];
                                    console.log('Failed checking email', e, ExtendableObject);
                                }).finally(function () {
                                    ExtendableObject._awaits--;
                                    ExtendableObject._changed = false;
                                });
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

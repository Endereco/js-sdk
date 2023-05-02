var EmailExtension = {
    name: 'EmailExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {

            // Add email field.
            ExtendableObject._email = '';
            ExtendableObject._subscribers.email = [];

            // Add change event hadler.
            ExtendableObject.cb.emailChange = function(subscriber) {
                return function(e) {
                    ExtendableObject.email = subscriber.value;
                }
            };

            // Add the "emaiL" property
            Object.defineProperty(ExtendableObject, 'email', {
                get: function() {
                    return this._email;
                },
                set: function(value) {
                    var oldValue = ExtendableObject._email;
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        var newValue = value;
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
                                            oldValue: oldValue,
                                            newValue: newValue,
                                            object: ExtendableObject
                                        }
                                    }
                                )
                            );

                            // Check address, if the extension is loaded.
                            if (ExtendableObject.active && ExtendableObject.hasLoadedExtension('EmailCheckExtension')) {
                                ExtendableObject._awaits++;
                                if ('' === value.trim()) {
                                    ExtendableObject.emailStatus = [];
                                } else {
                                    ExtendableObject.util.checkEmail().then(function(data) {
                                        var statusCollector = {};

                                        if (data.status.includes('A1000')) {
                                            statusCollector['email_correct'] = true;
                                        }
                                        if (data.status.includes('A1100')) {
                                            statusCollector['email_correct'] = true;
                                            statusCollector['email_catchall'] = true;
                                        }
                                        if (data.status.includes('A1110')) {
                                            statusCollector['email_correct'] = true;
                                            statusCollector['email_catchall'] = true;
                                        }
                                        if (data.status.includes('A1400')) {
                                            statusCollector['email_correct'] = true;
                                            statusCollector['email_disposable'] = true;
                                        }
                                        if (data.status.includes('A4000')) {
                                            statusCollector['email_not_correct'] = true;
                                            statusCollector['email_error'] = true;
                                        }
                                        if (data.status.includes('A4100')) {
                                            statusCollector['email_not_correct'] = true;
                                            statusCollector['email_smtp_problem'] = true;
                                        }
                                        if (data.status.includes('A4110')) {
                                            statusCollector['email_not_correct'] = true;
                                            statusCollector['email_smtp_problem'] = true;
                                        }
                                        if (data.status.includes('A4200')) {
                                            statusCollector['email_not_correct'] = true;
                                            statusCollector['email_syntax_error'] = true;
                                        }
                                        if (data.status.includes('A4300')) {
                                            statusCollector['email_not_correct'] = true;
                                            statusCollector['email_address_unknown'] = true;
                                        }
                                        if (data.status.includes('A4400')) {
                                            statusCollector['email_not_correct'] = true;
                                            statusCollector['email_delivery_failed'] = true;
                                        }
                                        if (data.status.includes('A4500')) {
                                            statusCollector['email_not_correct'] = true;
                                            statusCollector['email_relay_error'] = true;
                                        }
                                        if (data.status.includes('A4600')) {
                                            statusCollector['email_not_correct'] = true;
                                            statusCollector['email_blocked_by_antispam'] = true;
                                        }
                                        if (data.status.includes('A4700')) {
                                            statusCollector['email_not_correct'] = true;
                                            statusCollector['email_cant_receive'] = true;
                                        }
                                        if (data.status.includes('A4800')) {
                                            statusCollector['email_not_correct'] = true;
                                            statusCollector['email_no_mailserver_found'] = true;
                                        }
                                        if (data.status.includes('A4810')) {
                                            statusCollector['email_not_correct'] = true;
                                            statusCollector['email_mailserver_down'] = true;
                                        }
                                        if (data.status.includes('A4900')) {
                                            statusCollector['email_spam_trap'] = true;
                                        }
                                        if (data.status.includes('A5000')) {
                                            statusCollector['email_could_not_be_verified'] = true;
                                        }
                                        ExtendableObject.emailStatus = ExtendableObject.util.merge(data.status, Object.keys(statusCollector));
                                    }).catch(function(e) {
                                        ExtendableObject.emailStatus = [];
                                        console.log('Failed checking email', e, ExtendableObject);
                                    }).finally(function() {
                                        ExtendableObject._awaits--;
                                    })
                                }
                            }
                        }
                    }).catch().finally(function() {
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
}

export default EmailExtension

import EnderecoSubscriber from './../../subscriber';

var SessionExtension = {
    name: 'SessionExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {

            // Add email field.
            ExtendableObject._sessionId = '';
            ExtendableObject._subscribers.sessionId = [];
            ExtendableObject._sessionCounter = '';
            ExtendableObject._subscribers.sessionCounter = [];

            ExtendableObject.forms = [];
            ExtendableObject.formsWithSession = [];

            // Add change event hadler.
            ExtendableObject.cb.sessionIdChange = function(subscriber) {
                return function(e) {
                    ExtendableObject.sessionId = subscriber.value;
                }
            };

            ExtendableObject.cb.sessionCounterChange = function(subscriber) {
                return function(e) {
                    ExtendableObject.sessionCounter = subscriber.value;
                }
            };

            setInterval( function() {
                if (ExtendableObject.forms.length !== ExtendableObject.formsWithSession.length) {
                    ExtendableObject.forms.forEach( function(form) {
                        if (!ExtendableObject.formsWithSession.includes(form)) {
                            // Wait for the first form to appear and render the session in it.
                            var sessionIdHtml = ExtendableObject.util.Mustache.render('<input type="hidden" name="{{name}}" value="">', {
                                name: ExtendableObject.fullName + '_session_id'
                            });
                            var sessionCounterHtml = ExtendableObject.util.Mustache.render('<input type="hidden" name="{{name}}" value="">', {
                                name: ExtendableObject.fullName + '_session_counter'
                            });
                            form.insertAdjacentHTML('afterbegin', sessionIdHtml);
                            form.insertAdjacentHTML('afterbegin', sessionCounterHtml);
                            ExtendableObject.formsWithSession.push(form)
                        }
                    })



                }
            }, 500);


            // Add the "emaiL" property
            Object.defineProperty(ExtendableObject, 'sessionId', {
                get: function() {
                    return this._sessionId;
                },
                set: function(value) {
                    var oldValue = ExtendableObject._sessionId;
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        var newValue = value;
                        if (oldValue !== newValue) {
                            ExtendableObject._sessionId = newValue;

                            // Inform all subscribers about the change.
                            ExtendableObject._subscribers.sessionId.forEach(function (subscriber) {
                                subscriber.value = value;
                            });

                            // Fire change event for listeners.
                            ExtendableObject.fire(
                                new ExtendableObject.util.CustomEvent(
                                    'change',
                                    {
                                        detail: {
                                            fieldName: 'sessionId',
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

            // Add the "emaiL" property
            Object.defineProperty(ExtendableObject, 'sessionCounter', {
                get: function() {
                    return this._sessionCounter;
                },
                set: function(value) {
                    var oldValue = ExtendableObject._sessionCounter;
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        var newValue = value;
                        if (oldValue !== newValue) {
                            ExtendableObject._sessionCounter = newValue;

                            // Inform all subscribers about the change.
                            ExtendableObject._subscribers.sessionCounter.forEach(function (subscriber) {
                                subscriber.value = value;
                            });

                            // Fire change event for listeners.
                            ExtendableObject.fire(
                                new ExtendableObject.util.CustomEvent(
                                    'change',
                                    {
                                        detail: {
                                            fieldName: 'sessionCounter',
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

            ExtendableObject.onAfterCreate.push(function() {
                ExtendableObject.waitForActive().then( function() {
                   // Subscribe to own fields.
                    ExtendableObject.addSubscriber(
                      new EnderecoSubscriber(
                          'sessionId',
                          document.querySelector('[name="' + ExtendableObject.fullName + '_session_id' + '"]')
                      )
                    );
                    ExtendableObject.addSubscriber(
                        new EnderecoSubscriber(
                            'sessionCounter',
                            document.querySelector('[name="' + ExtendableObject.fullName + '_session_counter' + '"]')
                        )
                    );

                    ExtendableObject.waitUntilReady().then(function() {
                        ExtendableObject.sessionCounter = 0;
                        ExtendableObject.sessionId = ExtendableObject.id;
                    }).catch();
                }).catch();
            })

            if (ExtendableObject.config.showDebugInfo) {
                console.log('SessionExtension applied');
            }

            resolve($self);
        });
    }
}

export default SessionExtension

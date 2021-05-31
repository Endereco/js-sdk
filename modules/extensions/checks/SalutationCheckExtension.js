var SalutationCheckExtension = {
    name: 'SalutationCheckExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension(['SalutationExtension', 'FirstNameExtension']).then(function() {
                // Add email field.
                ExtendableObject._salutationStatus = '';
                ExtendableObject._subscribers.salutationStatus = [];

                // Add change event hadler.
                ExtendableObject.cb.salutationStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.salutationStatus = subscriber.value;
                    }
                };

                // Add the "emaiL" property
                Object.defineProperty(ExtendableObject, 'salutationStatus', {
                    get: function() {
                        return this._salutationStatus;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._salutationStatus;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = value;
                            if (oldValue !== newValue) {
                                ExtendableObject._salutationStatus = newValue;
                                ExtendableObject._changed = false;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.salutationStatus.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'salutationStatus',
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

                ExtendableObject.util.checkSalutation = function(name = null) {
                    var $self = this;
                    if (!name) {
                        name = ExtendableObject.firstName;
                    }

                    return new ExtendableObject.util.Promise(function(resolve, reject) {
                        var message = {
                            'jsonrpc': '2.0',
                            'id': 1,
                            'method': 'nameCheck',
                            'params': {
                                'name': name
                            }
                        };

                        // Send user data to remote server for validation.
                        ExtendableObject._awaits++;
                        ExtendableObject.util.axios.post(ExtendableObject.config.apiUrl, message, {
                            timeout: 2000,
                            headers: {
                                'X-Auth-Key': ExtendableObject.config.apiKey,
                                                'X-Agent': ExtendableObject.config.agentName,
                                'X-Remote-Api-Url': ExtendableObject.config.remoteApiUrl,
                                'X-Transaction-Referer': window.location.href,
                                'X-Transaction-Id': (ExtendableObject.hasLoadedExtension('SessionExtension'))?ExtendableObject.sessionId:'not_required'
                            }
                        })
                            .then(function(response) {
                                if (undefined !== response.data.result) {
                                    // If session counter is set, increase it.
                                    if (ExtendableObject.hasLoadedExtension('SessionExtension')) {
                                        ExtendableObject.sessionCounter++;
                                    }

                                    resolve(response.data.result);
                                } else {
                                    reject(response.data)
                                }
                            })
                            .catch(function(e) {
                                reject(e.response)
                            })
                            .finally( function() {
                                ExtendableObject._awaits--;
                            });
                    })
                }


                if (ExtendableObject.config.showDebugInfo) {
                    console.log('SalutationCheckExtension applied');
                }

                resolve($self);
            }).catch(function() {
                console.log('Failed to load because of timeout');
                reject($self);
            })

        });
    }
}

export default SalutationCheckExtension

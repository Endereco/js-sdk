var NameCheckExtension = {
    name: 'NameCheckExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension(['SalutationExtension', 'FirstNameExtension', 'LastNameExtension', 'TitleExtension']).then(function() {
                // Add email field.
                ExtendableObject._salutationStatus = '';
                ExtendableObject._firstNameStatus = '';
                ExtendableObject._lastNameStatus = '';
                ExtendableObject._titleStatus = '';
                ExtendableObject._nameScore = '';
                ExtendableObject._subscribers.salutationStatus = [];
                ExtendableObject._subscribers.firstNameStatus = [];
                ExtendableObject._subscribers.lastNameStatus = [];
                ExtendableObject._subscribers.titleStatus = [];
                ExtendableObject._subscribers.nameScore = [];
                ExtendableObject._nameCheckRequestIndex = 1;

                // Add change event hadler.
                ExtendableObject.cb.salutationStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.salutationStatus = subscriber.value;
                    }
                };
                ExtendableObject.cb.firstNameStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.firstNameStatus = subscriber.value;
                    }
                };
                ExtendableObject.cb.lastNameStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.lastNameStatus = subscriber.value;
                    }
                };
                ExtendableObject.cb.nameScoreStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.nameScoreStatus = subscriber.value;
                    }
                };
                ExtendableObject.cb.titleStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.titleStatus = subscriber.value;
                    }
                };

                ExtendableObject.isTitleRelevant = function() {
                    var isTitleRelevant = false;
                    if ((0 < ExtendableObject._subscribers.title.length)) {
                        ExtendableObject._subscribers.title.forEach( function(listener) {
                            if (!listener.object.disabled
                                && listener.object.isConnected) {
                                isTitleRelevant = true;
                            }
                        });
                    }
                    return isTitleRelevant;
                }

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

                Object.defineProperty(ExtendableObject, 'firstNameStatus', {
                    get: function() {
                        return this._firstNameStatus;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._firstNameStatus;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = value;
                            if (oldValue !== newValue) {
                                ExtendableObject._firstNameStatus = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.firstNameStatus.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                  new ExtendableObject.util.CustomEvent(
                                    'change',
                                    {
                                        detail: {
                                            fieldName: 'firstNameStatus',
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

                Object.defineProperty(ExtendableObject, 'lastNameStatus', {
                    get: function() {
                        return this._lastNameStatus;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._lastNameStatus;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = value;
                            if (oldValue !== newValue) {
                                ExtendableObject._lastNameStatus = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.lastNameStatus.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                  new ExtendableObject.util.CustomEvent(
                                    'change',
                                    {
                                        detail: {
                                            fieldName: 'lastNameStatus',
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

                Object.defineProperty(ExtendableObject, 'titleStatus', {
                    get: function() {
                        return this._titleStatus;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._titleStatus;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = value;
                            if (oldValue !== newValue) {
                                ExtendableObject._titleStatus = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.titleStatus.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                  new ExtendableObject.util.CustomEvent(
                                    'change',
                                    {
                                        detail: {
                                            fieldName: 'titleStatus',
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

                Object.defineProperty(ExtendableObject, 'nameScore', {
                    get: function() {
                        return this._nameScore;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._nameScore;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = value;
                            if (oldValue !== newValue) {
                                ExtendableObject._nameScore = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.nameScore.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                  new ExtendableObject.util.CustomEvent(
                                    'change',
                                    {
                                        detail: {
                                            fieldName: 'nameScore',
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

                ExtendableObject.util.shouldBeChecked = function() {
                    if (!ExtendableObject._changed) {
                        return false;
                    }
                    return true;
                }

                ExtendableObject.util.checkPerson = function(person = null) {
                    var $self = this;
                    if (!person) {
                        person = {
                            title: ExtendableObject.title,
                            firstName: ExtendableObject.firstName,
                            lastName: ExtendableObject.lastName,
                            salutation: ExtendableObject.salutation
                        };
                    }

                    return new ExtendableObject.util.Promise(function(resolve, reject) {

                        var message = {
                            'jsonrpc': '2.0',
                            'id': ExtendableObject._nameCheckRequestIndex,
                            'method': 'nameCheck',
                            'params': {
                                'firstName': person.firstName,
                                'lastName': person.lastName,
                                'salutation': person.salutation
                            }
                        };

                        if ((0 < ExtendableObject._subscribers.title.length)) {
                            ExtendableObject._subscribers.title.forEach( function(listener) {
                                if (!listener.object.disabled
                                    && listener.object.isConnected) {
                                    message.params.title = person.title;
                                }
                            });
                        }

                        // Send user data to remote server for validation.
                        ExtendableObject._awaits++;

                        const headers = {
                            'X-Agent': ExtendableObject.config.agentName,
                            'X-Remote-Api-Url': ExtendableObject.config.remoteApiUrl,
                            'X-Transaction-Referer': window.location.href,
                            'X-Transaction-Id': (ExtendableObject.hasLoadedExtension('SessionExtension'))?ExtendableObject.sessionId:'not_required'
                        };

                        if (ExtendableObject.config.apiKey) {
                            headers['X-Auth-Key'] = ExtendableObject.config.apiKey;
                        }

                        ExtendableObject.util.axios.post(ExtendableObject.config.apiUrl, message, {
                            timeout: 2000,
                            headers
                        })
                            .then(function(response) {
                                if (undefined !== response.data.result) {
                                    // If session counter is set, increase it.
                                    if (ExtendableObject.hasLoadedExtension('SessionExtension')) {
                                        ExtendableObject.sessionCounter++;
                                    }

                                    // Process the response.
                                    // Rewrite input.
                                    var responseStatus = response.data.result.status;
                                    var responsePredictions = response.data.result.predictions;
                                    var salutationCopied = false;

                                    if (responseStatus.includes('name_is_natural_person')
                                      && (responseStatus.includes('name_needs_correction') || responseStatus.includes('name_correct'))
                                    ) {

                                        ExtendableObject.firstNameStatus = [];
                                        ExtendableObject.lastNameStatus = [];

                                        if (!['m', 'f', 'd'].includes(ExtendableObject.salutation) && !!responsePredictions[0].salutation) {
                                            ExtendableObject.salutation = responsePredictions[0].salutation;
                                            salutationCopied = true;
                                        }

                                        if (1 === ExtendableObject._nameCheckRequestIndex) {
                                            if (!responseStatus.includes('name_transpositioned')) {
                                                ExtendableObject.firstName = responsePredictions[0].firstName;
                                                ExtendableObject.lastName = responsePredictions[0].lastName;


                                                ExtendableObject.firstNameStatus = ['first_name_correct'];
                                                ExtendableObject.lastNameStatus = ['last_name_correct'];

                                                if (ExtendableObject.isTitleRelevant()) {
                                                    ExtendableObject.title = responsePredictions[0].title;

                                                    if (responsePredictions[0].title !== '') {
                                                        ExtendableObject.titleStatus = ['title_correct'];
                                                    }
                                                }


                                            } else if (responseStatus.includes('name_transpositioned')) {
                                                if (ExtendableObject.config.ux.correctTranspositionedNames) {
                                                    ExtendableObject.lastName = responsePredictions[0].lastName;
                                                    ExtendableObject.firstName = responsePredictions[0].firstName;
                                                } else {
                                                    ExtendableObject.lastName = responsePredictions[0].firstName;
                                                    ExtendableObject.firstName = responsePredictions[0].lastName;
                                                }

                                                if (ExtendableObject.isTitleRelevant()) {
                                                    ExtendableObject.title = responsePredictions[0].title;

                                                    if (responsePredictions[0].title !== '') {
                                                        ExtendableObject.titleStatus = ['title_correct'];
                                                    }
                                                }

                                                ExtendableObject.firstNameStatus = ['first_name_correct'];
                                                ExtendableObject.lastNameStatus = ['last_name_correct'];
                                            }
                                        }

                                        if (responseStatus.includes('name_correct')) {
                                            ExtendableObject.firstNameStatus = ['first_name_correct'];
                                            ExtendableObject.lastNameStatus = ['last_name_correct'];
                                            if (ExtendableObject.isTitleRelevant() && ExtendableObject.title !== '') {
                                                ExtendableObject.titleStatus = ['title_correct'];
                                            }
                                        }

                                        ExtendableObject._changed = false;

                                        // Set statuscodes.
                                        if (salutationCopied) {
                                            ExtendableObject.salutationStatus = ['salutation_correct'];
                                        } else {
                                            if (!responsePredictions[0].salutation) {
                                                ExtendableObject.salutationStatus = [];
                                            } else {
                                                ExtendableObject.salutationStatus =
                                                  (responseStatus.includes('salutation_needs_correction'))?['salutation_needs_correction']:['salutation_correct'];
                                            }
                                        }

                                    } else if (responseStatus.includes('name_not_found')) {
                                        ExtendableObject.salutationStatus = ['salutation_needs_correction'];
                                        ExtendableObject.firstNameStatus = ['first_name_needs_correction'];
                                        ExtendableObject.lastNameStatus = ['last_name_needs_correction'];

                                        if (ExtendableObject.isTitleRelevant() && ExtendableObject.title !== '') {
                                            ExtendableObject.titleStatus = ['title_needs_correction'];
                                        }
                                    }

                                    if (undefined !== response.data.result.score) {
                                        ExtendableObject.nameScore = response.data.result.score
                                    } else {
                                        ExtendableObject.nameScore = 1.0;
                                    }

                                    resolve();
                                } else {
                                    reject(response.data)
                                }
                            })
                            .catch(function(e) {
                                reject(e.response)
                            })
                            .finally( function() {
                                ExtendableObject._awaits--;
                                ExtendableObject._nameCheckRequestIndex++;
                            });
                    })
                }


                if (ExtendableObject.config.showDebugInfo) {
                    console.log('NameCheckExtension applied');
                }

                resolve($self);
            }).catch(function() {
                console.log('Failed to load because of timeout');
                reject($self);
            })

        });
    }
}

export default NameCheckExtension

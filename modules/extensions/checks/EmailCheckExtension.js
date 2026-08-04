import statusWrapper from "../../../templates/email_check_status_wrapper.html";

var EmailCheckExtension = {
    name: 'EmailCheckExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('EmailExtension').then(function() {
                // Add email field.
                ExtendableObject._emailStatus = '';
                ExtendableObject._subscribers.emailStatus = [];

                ExtendableObject.config.templates.statusWrapper = statusWrapper;

                if (undefined === ExtendableObject.config.ux.showEmailStatus) {
                    ExtendableObject.config.ux.showEmailStatus = false;
                }

                // Add change event hadler.
                ExtendableObject.cb.emailStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.emailStatus = subscriber.value;
                    }
                };

                ExtendableObject.cb.onEmailChecked = [];
                ExtendableObject.cb.onEmailCheckFailed = [];

                // Add the "emaiL" property
                Object.defineProperty(ExtendableObject, 'emailStatus', {
                    get: function() {
                        return this._emailStatus;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._emailStatus;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            if (typeof value === 'string') {
                                if ('' === value) {
                                    value = [];
                                } else {
                                    value = [value];
                                }
                            }
                            var newValue = value;
                            if (oldValue !== newValue) {
                                ExtendableObject._emailStatus = newValue;
                                ExtendableObject._changed = false;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.emailStatus.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'emailStatus',
                                                oldValue: oldValue,
                                                newValue: newValue,
                                                object: ExtendableObject
                                            }
                                        }
                                    )
                                );

                                if (ExtendableObject.config.ux.showEmailStatus) {
                                    ExtendableObject.util.renderStatusMessages();
                                }
                            }
                        }).catch().finally(function() {
                            ExtendableObject._awaits--;
                        });

                    }
                });

                ExtendableObject.util.renderStatusMessages = function() {
                    var statuses = [];

                    ExtendableObject.emailStatus.forEach( function(emailStatus) {
                        if (!!ExtendableObject.config.texts.statuses[emailStatus]) {
                            statuses.push({
                                status: emailStatus,
                                text: ExtendableObject.config.texts.statuses[emailStatus]
                            })
                        }
                    })

                    if (document.querySelectorAll('.endereco-status-wrapper[data-id="' + ExtendableObject.id + '"]')) {
                        document.querySelectorAll('.endereco-status-wrapper[data-id="' + ExtendableObject.id + '"]').forEach( function(DOMElement) {
                            DOMElement.remove();
                        });
                    }

                    if (0 < statuses.length) {
                        var wrapperHtml = ExtendableObject.util.Mustache.render(
                            ExtendableObject.config.templates.statusWrapper,
                            {
                                'ExtendableObject': ExtendableObject,
                                'statuses': statuses
                            }
                        )
                        var messageContainer = document.querySelector(ExtendableObject.config.ux.errorContainer);
                        var insertMode = ["beforebegin", "afterbegin","beforeend","afterend"].includes(
                            ExtendableObject.config.ux.errorInsertMode
                        ) ? ExtendableObject.config.ux.errorInsertMode : "afterbegin";

                        if (!!messageContainer) {
                            messageContainer.insertAdjacentHTML(insertMode, wrapperHtml);
                        } else {
                            ExtendableObject._subscribers.email.forEach( function(subscriber) {
                                subscriber.object.insertAdjacentHTML('afterend', wrapperHtml);
                            });
                        }
                    }

                }

                ExtendableObject.util.checkEmail = function(email = null) {
                    var $self = this;
                    if (!email) {
                        email = ExtendableObject.email;
                    }
                    return new ExtendableObject.util.Promise(function(resolve, reject) {
                        var message = {
                            'jsonrpc': '2.0',
                            'id': 1,
                            'method': 'emailCheck',
                            'params': {
                                'email': email
                            }
                        };

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
                            timeout: 6000,
                            headers
                        })
                            .then(function(response) {
                                if (undefined !== response.data.result) {
                                    // If session counter is set, increase it.
                                    if (ExtendableObject.hasLoadedExtension('SessionExtension')) {
                                        ExtendableObject.sessionCounter++;
                                    }

                                    ExtendableObject.cb.onEmailChecked.forEach( function(cb) {
                                        cb(ExtendableObject, response.data);
                                    });

                                    resolve(response.data.result);
                                } else {
                                    ExtendableObject.cb.onEmailCheckFailed.forEach( function(cb) {
                                        cb(ExtendableObject, response.data);
                                    });

                                    reject(response.data)
                                }
                            })
                            .catch(function(e) {
                                ExtendableObject.cb.onEmailCheckFailed.forEach( function(cb) {
                                    cb(ExtendableObject, e.response);
                                });

                                reject(e.response);
                            })
                            .finally( function() {
                                ExtendableObject._awaits--;
                            });
                    })
                }


                if (ExtendableObject.config.showDebugInfo) {
                    console.log('EmailCheckExtension applied');
                }

                resolve($self);
            }).catch(function() {
                console.log('Failed to load because of timeout');
                reject($self);
            })

        });
    }
}

export default EmailCheckExtension

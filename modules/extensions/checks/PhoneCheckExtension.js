import statusWrapper from "../../../templates/phone_check_status_wrapper.html";

var PhoneCheckExtension = {
    name: 'PhoneCheckExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('PhoneExtension').then(function() {
                // Add email field.
                ExtendableObject._phoneStatus = [];
                ExtendableObject._subscribers.phoneStatus = [];
                ExtendableObject.phoneCheckRequestCounter = 1;

                ExtendableObject.config.templates.statusWrapper = statusWrapper;

                if (undefined === ExtendableObject.config.ux.showPhoneStatus) {
                    ExtendableObject.config.ux.showPhoneStatus = false;
                }

                // Add change event hadler.
                ExtendableObject.cb.phoneStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.phoneStatus = subscriber.value;
                    }
                };

                ExtendableObject.util.shouldBeChecked = function() {
                    if (!ExtendableObject.phone) {
                        return false;
                    }

                    if (!ExtendableObject._changed) {
                        return false;
                    }

                    return true;
                }

                // Add the "emaiL" property
                Object.defineProperty(ExtendableObject, 'phoneStatus', {
                    get: function() {
                        return this._phoneStatus;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._phoneStatus;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var index;
                            var newValue = value;
                            if (oldValue !== newValue) {
                                // Check if the type of phone is fitting in.
                                if ('mobile' === ExtendableObject.numberType
                                    && !newValue.includes('phone_is_mobile')
                                    && newValue.length > 0
                                ) {
                                    index = newValue.indexOf('phone_correct');
                                    if (index !== -1) {
                                        newValue.splice(index, 1);
                                    }
                                    newValue.push('phone_wrong_type')
                                    newValue.push('phone_should_be_mobile')
                                } else if ('fixedLine' === ExtendableObject.numberType
                                    && !newValue.includes('phone_is_fixed_line')
                                    && newValue.length > 0
                                ) {
                                    index = newValue.indexOf('phone_correct');
                                    if (index !== -1) {
                                        newValue.splice(index, 1);
                                    }
                                    newValue.push('phone_wrong_type');
                                    newValue.push('phone_should_be_fixed')
                                }

                                ExtendableObject._phoneStatus = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.phoneStatus.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'phoneStatus',
                                                oldValue: oldValue,
                                                newValue: newValue,
                                                object: ExtendableObject
                                            }
                                        }
                                    )
                                );

                                if (ExtendableObject.config.ux.showPhoneErrors) {
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
                    var formatMessage = '';
                    var uniqueContainer = {};
                    if (!Array.isArray(ExtendableObject.phoneStatus)) {
                        return;
                    }
                    ExtendableObject.phoneStatus.forEach( function(phoneStatus) {
                        if (!!ExtendableObject.config.texts.statuses[phoneStatus] &&
                            !uniqueContainer[phoneStatus]
                        ) {
                            statuses.push({
                                status: phoneStatus,
                                text: ExtendableObject.config.texts.statuses[phoneStatus]
                            });
                            uniqueContainer[phoneStatus] = true;
                        }
                    })

                    statuses = statuses.filter(function(value, index, self) {
                        return self.indexOf(value) === index;
                    });

                    if (document.querySelectorAll('.endereco-status-wrapper[data-id="' + ExtendableObject.id + '"]')) {
                        document.querySelectorAll('.endereco-status-wrapper[data-id="' + ExtendableObject.id + '"]').forEach( function(DOMElement) {
                            DOMElement.remove();
                        });
                    }

                    if (0 < statuses.length) {
                        if (ExtendableObject.config.phoneFormat &&
                          ExtendableObject.config.texts.requiredFormat[ExtendableObject.config.phoneFormat] &&
                            ExtendableObject.phoneStatus.includes('phone_format_needs_correction')
                        ) {
                            formatMessage = ExtendableObject.config.texts.requiredFormat[ExtendableObject.config.phoneFormat]
                        }


                        var wrapperHtml = ExtendableObject.util.Mustache.render(
                            ExtendableObject.config.templates.statusWrapper,
                            {
                                'ExtendableObject': ExtendableObject,
                                'statuses': statuses,
                                'requiredFormat': formatMessage
                            }
                        )

                        ExtendableObject._subscribers.phone.forEach( function(subscriber) {
                            subscriber.object.insertAdjacentHTML('afterend', wrapperHtml);
                        });
                    }

                }

                ExtendableObject.util.checkPhone = function(phone = null) {
                    var $self = this;
                    if (!phone) {
                        phone = ExtendableObject.phone;
                    }

                    ExtendableObject._phoneStatus = [];

                    return new ExtendableObject.util.Promise(function(resolve, reject) {
                        var message = {
                            'jsonrpc': '2.0',
                            'id': ExtendableObject.phoneCheckRequestCounter,
                            'method': 'phoneCheck',
                            'params': {
                                'phone': phone,
                            }
                        };

                        if (!!ExtendableObject.countryCode) {
                            message.params.countryCode = ExtendableObject.countryCode;
                        } else {
                            message.params.countryCode = window.EnderecoIntegrator.defaultCountry ?? 'DE';
                        }

                        if (ExtendableObject.config.phoneFormat) {
                            message.params.format = ExtendableObject.config.phoneFormat;
                        }

                        // Send user data to remote server for validation.
                        ExtendableObject._awaits++;
                        ExtendableObject.util.axios.post(ExtendableObject.config.apiUrl, message, {
                            timeout: 6000,
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
                                ExtendableObject.phoneCheckRequestCounter++;
                                ExtendableObject._awaits--;
                            });
                    })
                }


                if (ExtendableObject.config.showDebugInfo) {
                    console.log('PhoneCheckExtension applied');
                }

                resolve($self);
            }).catch(function() {
                console.log('Failed to load because of timeout');
                reject($self);
            })

        });
    }
}

export default PhoneCheckExtension

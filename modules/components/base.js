import axios from 'axios';
import Mustache from 'mustache';
import levenstein from 'fast-levenshtein';
import Promise from 'promise-polyfill';
import merge from 'lodash.merge';
import isEqual from 'lodash.isequal';
import { v4 as uuidv4 } from 'uuid';

function EnderecoBase() {
    return {
        id: uuidv4(),
        config: {
            agentName: "DefaultAgent v1.0.0",
            showDebugInfo: true,
            lang: 'de',
            splitStreet: true,
            useAutocomplete: true,
            ux: {
                smartFill: true,
                smartFillBlockTime: 600,
                resumeSubmit: true,
                disableBrowserAutocomplete: true,
                maxAutocompletePredictionItems: 100,
                maxAddressPredictionItems: 3,
                delay: {
                    inputAssistant: 100,
                    streetCopy: 600
                },
                requestTimeout: 8000
            },
            trigger: {
                onblur: true,
                onsubmit: true
            },
            templates: {
                default: ''
            },
            texts: {
                default: ''
            }
        },
        type: 'base',
        name: 'default',
        fullName: 'default',
        forms: [],
        formsWithSession: [],
        fieldNames: [],
        states: {},

        active: false,
        activate: function() {
            this.active = true;
        },
        deactivate: function() {
            this.active = false;
        },

        _changed: false,

        _awaits: 0,
        waitForExtension: function(extensions, timeout=10) {
            var $self = this;
            return new Promise(function(resolve, reject) {
                if ('string' === typeof extensions) {
                    extensions = [extensions];
                }

                var intervalObject = setInterval( function() {
                    var allSet = true;
                    extensions.forEach(function(extensionName) {
                        if (!$self.hasLoadedExtension(extensionName)) {
                            allSet = false;
                        }
                    })

                    if (allSet) {
                        clearTimeout(timeoutObject);
                        clearInterval(intervalObject);
                        resolve();
                    }
                }, 100);

                var timeoutObject = setTimeout( function() {
                    clearTimeout(timeoutObject);
                    clearInterval(intervalObject);
                    console.log('Timeout!');
                    reject();
                }, timeout * 1000); // Transform seconds to milliseconds.
            })
        },
        waitForAllExtension: function(timeout = 10) {
            var $self = this;
            this._awaits++;
            return new Promise(function(resolve, reject) {
                var intervalObject = setInterval( function() {
                    if (Object.keys($self.loadedExtensions).length === $self.extensions.length) {
                        clearTimeout(timeoutObject);
                        clearInterval(intervalObject);
                        $self._awaits--;
                        resolve($self);
                    }
                }, 100);

                var timeoutObject = setTimeout( function() {
                    clearTimeout(timeoutObject);
                    clearInterval(intervalObject);
                    console.log('Timeout!');
                    $self._awaits--;
                    reject($self);
                }, timeout * 1000); // Transform seconds to milliseconds.
            })
        },
        waitForActive: function() {
            var $self = this;
            return new Promise(function(resolve, reject) {
                var intervalObject = setInterval( function() {
                    if ($self.active) {
                        clearInterval(intervalObject);
                        resolve();
                    }
                }, 100);
            })
        },
        waitUntilReady: function() {
            var $self = this;
            return new Promise(function(resolve, reject) {
                var waitForAwaits = setInterval(function() {
                    if(0 === $self._awaits) {
                        clearInterval(waitForAwaits);
                        resolve();
                    }
                }, 100);
            })
        },
        anyActive: function() {
            var $self = this;
            var hasAny = false;

            $self.fieldNames.forEach( function(fieldName) {
                if ($self._subscribers[fieldName]) {
                    $self._subscribers[fieldName].forEach( function(subscriber) {
                        if (null !== subscriber.object.offsetParent && document.activeElement === subscriber.object) {
                            hasAny = true;
                        }
                    });
                }
            });

            return hasAny;
        },
        anyMissing: function() {
            var $self = this;
            var hasAny = false;

            $self.fieldNames.forEach( function(fieldName) {
                if ($self._subscribers[fieldName]) {
                    $self._subscribers[fieldName].forEach( function(subscriber) {
                        if (!subscriber.object.isConnected) {
                            hasAny = true;
                        }
                    });
                }
            });

            return hasAny;
        },

        onAfterCreate: [],
        created: function() {
            var $self = this;
            this.onAfterCreate.forEach( function(cb) {
                cb($self);
            })
        },
        onCloseModal: [],
        modalClosed: function() {
            var $self = this;
            this.onCloseModal.forEach( function(cb) {
                cb($self);
            })
        },
        onAddressSelect: [],
        addressSelected: function() {
            var $self = this;
            this.onAddressSelect.forEach( function(cb) {
                cb($self);
            })
        },
        onBeforeSubmitResume: [],
        beforeSubmitResume: function() {
            var $self = this;
            this.onBeforeSubmitResume.forEach( function(cb) {
                cb($self);
            })
        },

        cb: {
            onFormSubmit: function(e) {
                // Do nothing.
            }
        },

        util: {
            axios: axios,
            Promise: Promise,
            Mustache: Mustache,
            levenstein: levenstein,
            merge: merge,
            isEqual: isEqual,
            CustomEvent: CustomEvent,
            generateId: function() {
                return uuidv4();
            }
        },

        // Event Handling.
        _subscribers: {},
        addSubscriber: function (EnderecoSubscriberObject) {
            var $self = this;
            $self._awaits++;
            this.waitForAllExtension().then(function() {
                if (!EnderecoSubscriberObject) {
                    console.log('No EnderecoSubscriber');
                    return null;
                }

                EnderecoSubscriberObject.subject = $self;

                if (undefined === $self._subscribers[EnderecoSubscriberObject.propertyName]) {
                    $self._subscribers[EnderecoSubscriberObject.propertyName] = [];
                }

                // Check if has form. Add to forms.
                if (
                    EnderecoSubscriberObject.object &&
                    EnderecoSubscriberObject.object.form
                ) {

                    if (EnderecoSubscriberObject.subject.config.trigger.onsubmit) {
                        setTimeout(function() {
                            EnderecoSubscriberObject.object.form.removeEventListener('submit', $self.cb.onFormSubmit);
                            EnderecoSubscriberObject.object.form.addEventListener('submit', $self.cb.onFormSubmit);
                        }, 1000);
                    }

                    if (
                        undefined !== $self.forms &&
                        $self.hasLoadedExtension('SessionExtension') &&
                        !$self.forms.includes(EnderecoSubscriberObject.object.form)
                    ) {
                        $self.forms.push(EnderecoSubscriberObject.object.form);
                    }
                }

                $self._subscribers[EnderecoSubscriberObject.propertyName].push(EnderecoSubscriberObject);

                if ($self.config.showDebugInfo) {
                    console.log('Add Subscriber ', EnderecoSubscriberObject);
                }
            }).catch().finally(function() {
                $self._awaits--;
            })
        },
        removeSubscriber: function(EnderecoSubscriber) {
            // TODO: remove subscriber from subscribers list.
        },
        syncValues: function() {
            var $self = this;
            return new Promise(function(resolve, reject) {
                var keys = Object.keys($self._subscribers);
                keys.forEach( function(key) {
                    $self._subscribers[key].forEach(function(subscriber) {
                        if(!!subscriber._subject) {
                            subscriber._subject._awaits++;
                        }
                        // Sync values.
                        $self.util.Promise.resolve(subscriber.value).then(function(subscriberValue) {
                            var innerValue = $self[key];

                            if(Array.isArray(innerValue)) {
                                innerValue = innerValue.join();
                            }

                            var innerValueEmpty = !innerValue && 0 !== innerValue;
                            var subscriberValueEmpty = !subscriberValue && 0 !== subscriberValue;

                            if (!subscriberValueEmpty && innerValueEmpty) {
                                $self[key] = subscriberValue;
                            }
                            if (subscriberValueEmpty && !innerValueEmpty) {
                                subscriber.value = $self[key];
                            }
                            if(!!subscriber._subject) {
                                subscriber._subject._awaits--;
                            }
                            resolve();
                        }).catch(function(e) {
                            if ($self.config.showDebugInfo) {
                                console.log('Error syncing values ', e);
                            }
                            reject(e);
                        })
                    })
                });
            })
        },
        setField: function(fieldName, fieldValue, markAsChanged=true) {
            var $self = this;
            $self._awaits++;
            $self.util.Promise.resolve(fieldValue).then(function(value) {
                // Set inner value.
                $self['_' + fieldName] = fieldValue;
                $self._subscribers[fieldName].forEach(function (subscriber) {
                    subscriber.value = value;
                });
                if (markAsChanged) {
                    $self._changed = true;
                }
            }).catch().finally(function() {
                $self._awaits--;
            });
        },

        // Event listener block.
        _listeners: {},
        addEventListener: function (eventName, listener, options = {}) {
            if (undefined === this._listeners[eventName]) {
                this._listeners[eventName] = [];
            }
            this._listeners[eventName].push(listener);
        },
        removeEventListener: function (eventName, listener, options = {}) {
            // TODO: remove callback function from listeners array.
        },

        // Extensions block.
        extensions: [
        ],
        loadedExtensions: {},
        loadExtensions: function () {
            var $self = this;
            this.extensions.forEach(function (extension) {
                if (!$self.loadedExtensions[extension.name]) {
                    $self._awaits++;
                    extension.extend($self).then(function(extension) {
                        $self.loadedExtensions[extension.name] = extension;
                    }).catch(function(e) {
                        if ($self.config.showDebugInfo) {
                            console.log('Failed to load extension', e, extension);
                        }
                    }).finally(function() {
                        $self._awaits--;
                    }) ;
                }
            })
        },
        hasLoadedExtension: function(extensionName) {
            return undefined !== this.loadedExtensions[extensionName];
        },

        // Event management.
        fire: function (event) {
            if (this.config.showDebugInfo) {
                console.log('Fire', event);
            }
            if (undefined !== this._listeners[event.type]) {
                this._listeners[event.type].forEach(function (listener) {
                    listener(event.detail);
                })
            }
        },
        trigger: function (eventName, eventArgs) {

        }
    }

}

export default EnderecoBase

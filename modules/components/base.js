import axios from 'axios';
import Mustache from 'mustache';
import levenstein from 'fast-levenshtein';
import Promise from 'promise-polyfill';
import merge from 'lodash.merge';
import isEqual from 'lodash.isequal';
import { v4 as uuidv4 } from 'uuid';

function EnderecoBase() {
    const BaseObject = {
        id: uuidv4(),
        config: {
            agentName: "DefaultAgent v1.0.0",
            showDebugInfo: true,
            lang: 'de',
            splitStreet: true,
            useAutocomplete: true,
            ux: {
                smartFill: false,
                smartFillBlockTime: 600,
                resumeSubmit: true,
                disableBrowserAutocomplete: true,
                maxAutocompletePredictionItems: 100,
                maxAddressPredictionItems: 3,
                delay: {
                    inputAssistant: 100,
                    streetCopy: 600,
                    onBlur: 300
                },
                requestTimeout: 8000,
                errorInsertMode: 'afterbegin',
                errorContainer: undefined
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
        waitForExtension: function(extensions, timeout= 10) {
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

            if (!!window.EnderecoIntegrator.$globalFilters && !!window.EnderecoIntegrator.$globalFilters.anyActive) {
                window.EnderecoIntegrator.$globalFilters.anyActive.forEach( function(callback) {
                    hasAny = callback(hasAny, $self);
                });
            }

            return hasAny;
        },
        anyMissing: function() {
            var $self = this;
            var hasAny = false;

            hasAny = false;
            $self.forms.forEach( function(form) {
                if (form.isConnected) {
                    hasAny = true;
                }
            });

            if (!!window.EnderecoIntegrator.$globalFilters && !!window.EnderecoIntegrator.$globalFilters.anyMissing) {
                window.EnderecoIntegrator.$globalFilters.anyMissing.forEach( function(callback) {
                    hasAny = callback(hasAny, $self);
                });
            }

            return !hasAny;
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
            },
            /**
             * Generates a unique ID that doesn't already exist as a DOM element ID
             * @param {string} prefix - Optional prefix for the ID (default: 'endereco')
             * @returns {string} - A unique ID
             */
            generateUniqueId: function(prefix = 'endereco') {
                let id;
                let attempts = 0;
                const maxAttempts = 100;
                
                do {
                    id = `${prefix}-${uuidv4()}`;
                    attempts++;
                    
                    if (attempts >= maxAttempts) {
                        console.warn('Max attempts reached generating unique ID, using timestamp fallback');
                        id = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        break;
                    }
                } while (document.getElementById(id));
                
                return id;
            },
            /**
             * Escapes HTML entities in a string to prevent XSS
             * @param {string} unsafe - The potentially unsafe string
             * @returns {string} - The escaped string
             */
            escapeHTML: function (unsafe) {
                if (typeof unsafe !== 'string') {
                    return unsafe;
                }

                return unsafe
                    .replaceAll(/&/g, '&amp;')
                    .replaceAll(/</g, '&lt;')
                    .replaceAll(/>/g, '&gt;')
                    .replaceAll(/"/g, '&quot;')
                    .replaceAll(/'/g, '&#039;');
            },
            /**
             * Sanitizes HTML content while preserving safe elements
             * @param {string} html - The HTML to sanitize
             * @returns {string} - The sanitized HTML
             */
            sanitizeHTML: function (html) {
                if (typeof html !== 'string') {
                    return html;
                }

                // Basic sanitization - remove script tags and event handlers
                return html
                    .replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replaceAll(/on\w+\s*=\s*"[^"]*"/gi, '')
                    .replaceAll(/on\w+\s*=\s*'[^']*'/gi, '')
                    .replaceAll(/javascript:/gi, '');
            },
            /**
             * Safely sets innerHTML using textContent for non-HTML content
             * @param {HTMLElement} element - The element to update
             * @param {string} content - The content to set
             * @param {boolean} allowHTML - Whether to allow HTML content
             */
            safeSetContent: function (element, content, allowHTML = false) {
                if (!element) return;

                if (allowHTML) {
                    element.innerHTML = this.sanitizeHTML(content);
                } else {
                    element.textContent = content;
                }
            }
        },

        api: {

        },

        getEnderecoAPI: function() {
            var $self = this;
            return {
                sendRequestToAPI: async function(body, headers) {
                    return $self.util.axios.post(
                        $self.config.apiUrl,
                        body,
                        {
                            timeout: $self.config.ux.requestTimeout,
                            headers
                        }
                    );
                }
            };
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
                    !!EnderecoSubscriberObject.object &&
                    !!EnderecoSubscriberObject.object.form
                ) {
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
        syncValues: async (specificKeys) => {
            const fieldNamesToSync = specificKeys || Object.keys(BaseObject._subscribers);
            try {
                // Use Promise.all to wait for all async operations to complete
                await Promise.all(fieldNamesToSync.map(async (fieldName) => {
                    if (!BaseObject._subscribers[fieldName] || BaseObject._subscribers[fieldName].length === 0) {
                        return;
                    }

                    // Use Promise.all again to wait for all subscribers to be processed
                    await Promise.all(BaseObject._subscribers[fieldName].map(async (subscriber) => {
                        const resolvedSubscriberValue = await BaseObject.util.Promise.resolve(subscriber.value);

                        // Get the value using getter if available
                        const getterMethodName = `get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`;
                        let innerValue;
                        if (typeof BaseObject[getterMethodName] === 'function') {
                            innerValue = await BaseObject[getterMethodName]();
                        } else {
                            innerValue = BaseObject[fieldName];
                        }

                        // Fix: Declare these variables properly in their respective scopes
                        let resolvedInnerValue;
                        if (Array.isArray(innerValue)) {
                            resolvedInnerValue = innerValue.join();
                        } else {
                            resolvedInnerValue = innerValue;
                        }

                        const innerValueEmpty = !resolvedInnerValue && resolvedInnerValue !== 0;
                        const subscriberValueEmpty = !resolvedSubscriberValue && resolvedSubscriberValue !== 0;

                        if (!subscriberValueEmpty && innerValueEmpty) {
                            // Use setter if available
                            const setterMethodName = `set${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`;
                            if (typeof BaseObject[setterMethodName] === 'function') {
                                await BaseObject[setterMethodName](resolvedSubscriberValue);
                            } else {
                                BaseObject[fieldName] = resolvedSubscriberValue;
                            }
                        }

                        if (subscriberValueEmpty && !innerValueEmpty) {
                            await subscriber.updateDOMValue(BaseObject[fieldName]);
                        }
                    }));
                }));
            } catch (err) {
                console.warn("Syncing value failed", err);
                throw err; // Re-throw to allow upstream error handling
            }

            return;
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

    return BaseObject;
}

export default EnderecoBase

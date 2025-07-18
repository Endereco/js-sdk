import merge from 'lodash.merge';
import Promise from 'promise-polyfill';
import "custom-event-polyfill";

function EnderecoSubscriber(propertyName, observableObject, options = {}) {
    var defaultOptions = {
        valueContainer: 'value', // value, classList, innerHTML
        displayAutocompleteDropdown: false,
        showDebugInfo: false,
        useWatcher: false,
        syncValue: false,
        autosubscribeToStatus: true,
        writeFilterCb: function(value, selfReference) {
            return new Promise(function(resolve, reject) {
                return resolve(value);
            })
        },
        readFilterCb: function(value, selfReference) {
            return new Promise(function(resolve, reject) {
                return resolve(value);
            })
        },
        customSetValue: undefined,
        customGetValue: undefined,
    }

    if (!observableObject) {
        return null;
    }

    options = merge(defaultOptions, options);

    function setupValueChangeDetection(subscriber, callback, interval = 300) {
        let element = subscriber.object;

        subscriber.lastValue = subscriber.getDOMValue();

        const checkValueChange = () => {
            if(!subscriber._allowFieldInspection) {
                return;
            }

            const currentValue = subscriber.getDOMValue();

            if (subscriber.object.type === 'radio') {
                if (subscriber.object.checked) {
                    subscriber.lastValue = currentValue;
                    callback();
                }
            } else if (subscriber.object.type === 'checkbox') {
                if (currentValue !== subscriber.lastValue && document.activeElement !== element) {
                    subscriber.lastValue = currentValue;
                    callback();
                }
            } else {
                if (currentValue !== subscriber.lastValue && document.activeElement !== element) {
                    subscriber.lastValue = currentValue;
                    callback();
                }
            }
        };

        const intervalId = setInterval(checkValueChange, interval);

        // Optional: Mutation observer for element removal
        const observer = setupMutationObserver(element, intervalId);

        // Return cleanup function
        return () => cleanup(observer, intervalId);
    }

    function setupValueInputDetection(subscriber, callback, interval = 10) {
        let element = subscriber.object;

        subscriber.lastValue = subscriber.getDOMValue();

        const checkValueInput = () => {
            if(!subscriber._allowFieldInspection) {
                return;
            }
            const currentValue = subscriber.getDOMValue();
            if (currentValue !== subscriber.lastValue && document.activeElement === element) {
                subscriber.lastValue = currentValue;
                callback();
            }
        };

        const intervalId = setInterval(checkValueInput, interval);

        // Optional: Mutation observer for element removal
        const observer = setupMutationObserver(element, intervalId);

        // Return cleanup function
        return () => cleanup(observer, intervalId);
    }

    function setupBlurDetection(subscriber, callback, interval = 10) {
        let element = subscriber.object;
        let isFocused = (document.activeElement === element);
        const checkForBlur = () => {
            const currentlyFocused = (document.activeElement === element);
            if (isFocused && !currentlyFocused) {
                callback(subscriber);  // Element has lost focus
            }
            isFocused = currentlyFocused;
        };

        const intervalId = setInterval(checkForBlur, interval);

        // Optional: Mutation observer for element removal
        const observer = setupMutationObserver(element, intervalId);

        // Return cleanup function
        return () => cleanup(observer, intervalId);
    }

    function setupMutationObserver(element, intervalId) {
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (!document.contains(element)) {
                    clearInterval(intervalId);
                    observer.disconnect();
                    break;
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        return observer;
    }

    function cleanup(observer, intervalId) {
        clearInterval(intervalId);
        observer.disconnect();
    }

    const subscriber = {
        propertyName: propertyName,
        _subject: null,
        object: observableObject,
        options: options,
        cleanupFunctions: [],
        lastValue: undefined,
        _allowFieldInspection: true,
        getLastValue: function() {
            return this.lastValue;
        },
        updateCheckedValue(newValue) {
            if (this.dispatchEvent('endereco-change')) {
                this.object.checked = newValue;
                this.dispatchEvent('endereco-blur');
            }
        },
        updateValue(newValue, updateInnerState = true) {
            this._allowFieldInspection = false;
            if (this.dispatchEvent('endereco-change')) {
                this.object.value = newValue;

                if (updateInnerState) {
                    this.lastValue = newValue;
                }

                this.dispatchEvent('endereco-blur');
            }
            this._allowFieldInspection = true;
        },
        dispatchEvent(eventName) {
            if (this._subject) {
                const event = new this._subject.util.CustomEvent(eventName, {
                    bubbles: true,
                    cancelable: eventName === 'endereco-change'
                });
                return this.object.dispatchEvent(event);
            }
            return false;
        },
        cleanupResources() {
            this.cleanupFunctions.forEach(cleanupFunc => cleanupFunc());
            this.cleanupFunctions = []; // Clear the array after cleanup
        },
        set subject(subject) {
            let $self = this;
            if (!subject) {
                return;
            }
            this._subject = subject;

            const changeCallbackGenerator = this.propertyName + 'Change';
            if (this._subject.cb[changeCallbackGenerator]) {
                const callbackForChange = this._subject.cb[changeCallbackGenerator](this);
                const cleanupChangeListener = setupValueChangeDetection(this, callbackForChange);
                this.cleanupFunctions.push(cleanupChangeListener);
            }

            const inputCallbackGenerator = this.propertyName + 'Input';
            if (this._subject.cb[inputCallbackGenerator]) {
                const callbackForInput = this._subject.cb[inputCallbackGenerator](this);
                const cleanupInputListener = setupValueInputDetection(this, callbackForInput);
                this.cleanupFunctions.push(cleanupInputListener);
            }

            const blurCallbackGenerator = this.propertyName+'Blur';
            if (undefined !== this._subject.cb[blurCallbackGenerator]) {
                const callbackForBlur = this._subject.cb[blurCallbackGenerator](this);
                const cleanupBlurListener = setupBlurDetection(this, callbackForBlur);
                this.cleanupFunctions.push(cleanupBlurListener);
            }

            const keydownCallbackGenerator = this.propertyName+'Keydown';
            if (undefined !== this._subject.cb[keydownCallbackGenerator]) {
                const keydownCBFunc = this._subject.cb[keydownCallbackGenerator](this);
                this.object.removeEventListener('keydown', this._subject.cb[keydownCallbackGenerator](this));
                this.object.addEventListener('keydown', this._subject.cb[keydownCallbackGenerator](this));

                this.cleanupFunctions.push(function() {
                    $self.object.removeEventListener('keydown', keydownCBFunc);
                });
            }

            // Add autocomplete disabler.
            if (this._subject.config.ux.disableBrowserAutocomplete &&
                ['text','number'].includes(this.object.type) &&
                subscriber.options.displayAutocompleteDropdown
            ) {
                if (/chrom(e|ium)/.test( navigator.userAgent.toLowerCase( ) )) {
                    this.object.setAttribute('autocomplete', 'autocomplete_' + Math.random().toString(36).substring(2) + Date.now());
                } else {
                    this.object.setAttribute('autocomplete', 'off' );
                }
            }
            const selfRef = this;
            const cleanupInterval = setInterval(function() {
                if (!document.contains(selfRef.object)) {
                    selfRef.cleanupResources();
                    clearInterval(cleanupInterval);
                }
            }, 100);

            // Skip for hidden type inputs.
            if (!!this.object && ('hidden' !== this.object.type)) {
                // Subscribe to status.
                // If is fieldName -> subscribe to next visible parent.
                if (subject.fieldNames.includes(this.propertyName) && this.options.autosubscribeToStatus) {
                    subject.addSubscriber(new EnderecoSubscriber(
                        this.propertyName + 'Status',
                        this.object.parentNode, // Subscribe to the parent,
                        {
                            valueContainer: 'classList'
                        }
                    ));
                }
            }

            if (this.options.syncValue) {
                var $this = this;
                var $key = this.propertyName;
                Promise.resolve($this.value).then(function(subscriberValue) {
                    var innerValue = subject[$key];

                    if(Array.isArray(innerValue)) {
                        innerValue = innerValue.join();
                    }

                    var innerValueEmpty = !innerValue && 0 !== innerValue;
                    var subscriberValueEmpty = !subscriberValue && 0 !== subscriberValue;

                    if (!subscriberValueEmpty && innerValueEmpty) {
                        subject[$key] = subscriberValue;
                    }
                    if (subscriberValueEmpty && !innerValueEmpty) {
                        subscriber.value = subject[$key];
                    }
                }).catch(function(e) {
                    if (subject.config.showDebugInfo) {
                        console.log('Error syncing values ', e);
                    }
                })
            }
        },
        get subject() {
            return this._subject;
        },
        get value() {
            var $self = this;
            var value = '';
            if ('classList' === this.options.valueContainer) {
                value = this.getClassList();
            } else if ('innerHTML' === this.options.valueContainer) {
                value = this.getInnerHTML();
            } else if ('value' === this.options.valueContainer) {
                if ($self.object.disabled) {
                    value = '';
                } else {
                    if (!!$self.options.customGetValue) {
                        value = $self.options.customGetValue($self);
                    } else {
                        value = $self.getValue();
                    }
                }
            } else {
                value = this.get(this.options.valueContainer);
            }
            return this.options.readFilterCb(value, $self);
        },
        set value(value) {
            var $self = this;

            if ($self.object.disabled && value !== '') {
                return;
            }

            if (!!$self._subject) {
                $self._subject._awaits++;
            }
            this.options.writeFilterCb(value, $self)
                .then(function(value) {
                    if ('classList' === $self.options.valueContainer) {
                        return $self.setClassList(value);
                    } else if ('innerHTML' === $self.options.valueContainer) {
                        return $self.setInnerHTML(value);
                    } else if ('value' === $self.options.valueContainer) {
                        if (!!$self.options.customSetValue) {
                            return $self.options.customSetValue($self, value);
                        } else {
                            return $self.setValue(value);
                        }

                    } else {
                        return $self.set($self.options.valueContainer, value);
                    }
                })
                .catch( function(e) {})
                .finally( function() {
                    if (!!$self._subject) {
                        $self._subject._awaits--;
                    }
                });
        },
        updateDOMValue: async (value) => {
            if (subscriber.object.disabled && value !== '') {
                return;
            }
            try {
                const resolvedValue = await subscriber.options.writeFilterCb(value, subscriber);
                if ('classList' === subscriber.options.valueContainer) {
                    subscriber.setClassList(resolvedValue);
                } else if ('innerHTML' === subscriber.options.valueContainer) {
                    subscriber.setInnerHTML(resolvedValue);
                } else if ('value' === subscriber.options.valueContainer) {
                    if (subscriber.options.customSetValue) {
                        subscriber.options.customSetValue(subscriber, resolvedValue);
                    } else {
                        subscriber.setValue(resolvedValue);
                    }
                } else {
                    return subscriber.set(subscriber.options.valueContainer, resolvedValue);
                }
            } catch (err) {
                console.warn("Failed to update subscribed DOM element value", {
                    error: err,
                    value: value
                });
            }
        },

        getDOMValue: () => {
            let value = '';
            if ('classList' === subscriber.options.valueContainer) {
                value = subscriber.getClassList();
            } else if ('innerHTML' === subscriber.options.valueContainer) {
                value = subscriber.getInnerHTML();
            } else if ('value' === subscriber.options.valueContainer) {
                if (subscriber.object.disabled) {
                    value = '';
                } else {
                    if (!!subscriber.options.customGetValue) {
                        value = subscriber.options.customGetValue(subscriber);
                    } else {
                        value = subscriber.getValue();
                    }
                }
            } else {
                value = subscriber.get(subscriber.options.valueContainer);
            }
            return value;
        },

        set: function(valueType, value) {
            if (this.object instanceof HTMLElement) {
                this.object.setAttribute(valueType, value);
            } else {
                if (undefined !== this.object[valueType]) {
                    this.object[valueType] = value;
                }
            }
        },
        setValue(value) {
            // Simplify the setting of `newValue` for checkbox and radio inputs
            if (['radio', 'checkbox'].includes(this.object.type)) {
                const newValue = this.object.value === String(value);
                this.updateCheckedValue(newValue);
            } else {
                // Handle array values and standard values
                const newValue = Array.isArray(value) ? value.join(',') : value;
                this.updateValue(newValue);
            }
        },
        setClassList: function(value) {
            // Remove classes from element.
            var $DOMElement = this.object;
            var originalClasses = [];
            var temp = $DOMElement.classList;
            var i;
            for (i = 0; i < temp.length; i++) {
                originalClasses.push(temp[i]);
            }
            var toRemove = [];
            originalClasses.forEach(function(className) {
                if (className.indexOf('endereco-s--') !== -1) {
                    toRemove.push(className);
                }
            });
            toRemove.forEach(function(singleValue) {
                $DOMElement.classList.remove(singleValue);
            });

            // Add classes.
            if (Array.isArray(value)) {
                value.forEach(function(singleValue) {
                    $DOMElement.classList.add('endereco-s--' + singleValue);
                })
            } else {
                // Assume string.
                $DOMElement.classList.add('endereco-s--' + value);
            }
        },
        setInnerHTML: function (value) {
            // Security fix: Use textContent by default to prevent XSS
            // If HTML content is truly needed, it should be explicitly sanitized
            if (this._subject && this._subject.util && this._subject.util.safeSetContent) {
                // Use the safe content setter from the base utility
                this._subject.util.safeSetContent(this.object, value, false);
            } else {
                // Fallback to textContent for safety
                this.object.textContent = value;
            }
        },
        get: function(valueType) {
            if (this.object instanceof HTMLElement) {
                return this.object.getAttribute(valueType);
            } else {
                if (undefined !== this.object[valueType]) {
                    return this.object[valueType];
                }
            }
        },
        getValue: function() {
            if (['radio', 'checkbox'].includes(this.object.type) ) {
                if (this.object.checked) {
                    return this.object.value;
                } else {
                    return '';
                }
            } else {
                return this.object.value;
            }
        },
        getClassList: function() {
            var toReturn = [];
            var originalClasses = [];
            var temp = this.object.classList;
            var i;
            for (i = 0; i < temp.length; i++) {
                originalClasses.push(temp[i]);
            }

            originalClasses.forEach(function(className) {
                if (className.indexOf('endereco-s--') !== -1) {
                    toReturn.push(className.replace('endereco-s--', ''));
                }
            });

            if (1 < toReturn.length) {
                return toReturn;
            } else if (1 === toReturn.length) {
                return toReturn[0];
            } else {
                return '';
            }
        },
        getInnerHTML: function() {
            return this.object.innerHTML;
        }
    }

    return subscriber;
}

export default EnderecoSubscriber

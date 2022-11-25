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
        writeFilterCb: function(value) {
            return new Promise(function(resolve, reject) {
                return resolve(value);
            })
        },
        readFilterCb: function(value) {
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

    var subscriber = {
        propertyName: propertyName,
        _subject: null,
        object: observableObject,
        options: options,
        set subject(subject) {
            if (!subject) {
                return;
            }
            this._subject = subject;
            var changeCallbackGenerator = this.propertyName+'Change';
            if (undefined !== this._subject.cb[changeCallbackGenerator]) {
                this.object.removeEventListener('change', this._subject.cb[changeCallbackGenerator](this));

                if (!!window.jQuery && !!window.jQuery.on) {
                    window.jQuery(this.object).on('change', this._subject.cb[changeCallbackGenerator](this));
                } else {
                    this.object.addEventListener('change', this._subject.cb[changeCallbackGenerator](this));
                }
            }

            var blurCallbackGenerator = this.propertyName+'Blur';
            if (undefined !== this._subject.cb[blurCallbackGenerator]) {
                this.object.removeEventListener('blur', this._subject.cb[blurCallbackGenerator](this));
                this.object.addEventListener('blur', this._subject.cb[blurCallbackGenerator](this));
            }

            var inputCallbackGenerator = this.propertyName+'Input';
            if (undefined !== this._subject.cb[inputCallbackGenerator]) {
                this.object.removeEventListener('input', this._subject.cb[inputCallbackGenerator](this));
                this.object.addEventListener('input', this._subject.cb[inputCallbackGenerator](this));
            }

            var keydownCallbackGenerator = this.propertyName+'Keydown';
            if (undefined !== this._subject.cb[keydownCallbackGenerator]) {
                this.object.removeEventListener('keydown', this._subject.cb[keydownCallbackGenerator](this));
                this.object.addEventListener('keydown', this._subject.cb[keydownCallbackGenerator](this));
            }

            // Add autocomplete disabler.
            if (this._subject.config.ux.disableBrowserAutocomplete && ['text','number'].includes(this.object.type)) {
                if (/chrom(e|ium)/.test( navigator.userAgent.toLowerCase( ) )) {
                    this.object.setAttribute('autocomplete', 'autocomplete_' + Math.random().toString(36).substring(2) + Date.now());
                } else {
                    this.object.setAttribute('autocomplete', 'off' );
                }
            }

            // Add autocomplete subsriber.
            // Skip for hidden type inputs.
            if (!!this.object && ('hidden' !== this.object.type)) {
                if (this.options.displayAutocompleteDropdown) {
                    subject.addSubscriber(new EnderecoSubscriber(
                        this.propertyName + 'Chunk',
                        this.object // Subscribe to the same element
                    ));
                }

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

            // Add autocomplete subscriber.
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
                    value = this.getValue();
                }

            } else {
                value = this.get(this.options.valueContainer);
            }
            return this.options.readFilterCb(value);
        },
        set value(value) {
            var $self = this;

            if ($self.object.disabled && value !== '') {
                return;
            }

            if (!!$self._subject) {
                $self._subject._awaits++;
            }
            this.options.writeFilterCb(value)
                .then(function(value) {
                    if (!!$self._subject) {
                        $self._subject._awaits--;
                    }
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
                .catch( function(e) {
                    if (!!$self._subject) {
                        $self._subject._awaits--;
                    }
            });
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
        setValue: function(value) {
            var $self = this;
            if (['radio', 'checkbox'].includes(this.object.type) ) {
                var preValue = this.object.checked;
                var newValue = false;

                if (this.object.value === ('' + value)) {
                    newValue = true;
                } else {
                    newValue = false;
                }

                if (!!this._subject) {
                    if (!!this.object.dispatchEvent(
                        new this._subject.util.CustomEvent(
                            'endereco-change',
                            {
                                'bubbles': true,
                                'cancelable': true
                            }
                        )
                    )) {
                        this.object.checked = newValue;
                        this.object.dispatchEvent(new this._subject.util.CustomEvent(
                            'endereco-blur',
                            {
                                'bubbles': true
                            }
                        ));
                    }
                } else {
                    this.object.checked = newValue;
                }
            } else {
                if (Array.isArray(value)) {
                    this.object.value = value.join(',');
                } else {
                    if (!!this._subject) {
                        if (!!this.object.dispatchEvent(
                            new this._subject.util.CustomEvent(
                                'endereco-change',
                                {
                                    'bubbles': true,
                                    'cancelable': true
                                }
                            )
                        )) {
                            this.object.value = value;
                            this.object.dispatchEvent(new this._subject.util.CustomEvent(
                                'endereco-blur',
                                {
                                    'bubbles': true
                                }
                            ));
                        }
                    } else {
                        this.object.value = value;
                    }

                    if (this.subject && this.subject.config.ux.smartFill) {
                        var blockFunc = function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        setTimeout(function() {
                            $self.object.removeEventListener('keydown', blockFunc);
                        }, this.subject.config.ux.smartFillBlockTime);
                        $self.object.addEventListener('keydown', blockFunc);
                    }
                }
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
        setInnerHTML: function(value) {
            this.object.innerHTML = value;
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

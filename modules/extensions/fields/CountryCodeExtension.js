const CountryCodeExtension = {
    name: 'CountryCodeExtension',

    /**
     * Registers properties on the ExtendableObject for country code management
     * @param {Object} ExtendableObject - The object to extend
     */
    registerProperties: (ExtendableObject) => {
        // Add _address, _addressStatus.
        ExtendableObject._countryCode = ''; // Germany is a preselected default.
        ExtendableObject._subscribers.countryCode = [];
        ExtendableObject._allowToNotifyCountryCodeSubscribers = true;
    },

    /**
     * Registers fields and their accessors on the ExtendableObject
     * @param {Object} ExtendableObject - The object to extend
     */
    registerFields: (ExtendableObject) => {
        // Add getter and setter for fields.
        Object.defineProperty(ExtendableObject, 'countryCode', {
            get: () => {
                return ExtendableObject.getCountryCode();
            },
            set: (value) => {
                // Value can be a string, array or promise.
                ExtendableObject._awaits++;
                try {
                    ExtendableObject.setCountryCode(value);
                } catch (err) {
                    console.warn('Error setting country code', {
                        error: err,
                        countryCode: value
                    });
                } finally {
                    ExtendableObject._awaits--;
                }
            }
        });

        /**
         * Gets the current country code
         * @returns {string} The current country code
         */
        ExtendableObject.getCountryCode = () => {
            return ExtendableObject._countryCode;
        };

        /**
         * Sets the country code on the ExtendableObject after resolving and normalizing it.
         * @param {string|Promise} countryCode - The country code to set (e.g., "DE", "US").
         * @returns {Promise<void>} Resolves when the country code is set or if no update is needed.
         * @throws {Error} If the country code is invalid or the callback fails.
         */
        ExtendableObject.setCountryCode = async (countryCode) => {
            const needToNotify = ExtendableObject.active && ExtendableObject._allowToNotifyCountryCodeSubscribers;

            let resolvedCountryCode = await Promise.resolve(countryCode);

            if (typeof resolvedCountryCode !== 'string') {
                resolvedCountryCode = String(resolvedCountryCode);
            }

            try {
                resolvedCountryCode = await ExtendableObject.cb.setCountryCode(resolvedCountryCode);
            } catch (err) {
                throw new Error(`Failed in setCountryCode callback: ${err.message}`);
            }

            resolvedCountryCode = resolvedCountryCode.toUpperCase();

            if (ExtendableObject._countryCode === resolvedCountryCode) {
                return;
            }

            if (needToNotify) {
                // Inform all subscribers about the change.
                ExtendableObject._subscribers.countryCode.forEach((subscriber) => {
                    subscriber.value = resolvedCountryCode;
                });
            }

            ExtendableObject._countryCode = resolvedCountryCode;
        };

        ExtendableObject.fieldNames.push('countryCode');
    },

    /**
     * Registers configuration settings for country code management
     * @param {Object} ExtendableObject - The object to extend
     */
    registerConfig: (ExtendableObject) => {
        // Doesn't exist yet.
    },

    /**
     * Registers event callbacks for country code changes
     * @param {Object} ExtendableObject - The object to extend
     */
    registerEventCallbacks: (ExtendableObject) => {
        /**
         * Callback for when the country code changes
         * @param {Object} subscriber - The subscriber object that triggered the change
         * @returns {Function} Event handler function
         */
        ExtendableObject.cb.countryCodeChange = (subscriber) => {
            return (e) => {
                ExtendableObject._allowToNotifyCountryCodeSubscribers = false;
                ExtendableObject.setCountryCode(subscriber.value);
                ExtendableObject._allowToNotifyCountryCodeSubscribers = true;

                if (ExtendableObject.hasLoadedExtension('SubdivisionCodeExtension')) {
                    if ((ExtendableObject._subscribers.subdivisionCode.length > 0)) {
                        ExtendableObject._subdivisionCode = '';
                        ExtendableObject._subscribers.subdivisionCode.forEach(function (subscriber) {
                            subscriber.value = '';
                        });
                    }
                }

                if (ExtendableObject.active) {
                    ExtendableObject._changed = true;
                }
            };
        };

        /**
         * Callback for input events on the country code field
         * @param {Object} subscriber - The subscriber object that triggered the input
         * @returns {Function} Event handler function
         */
        ExtendableObject.cb.countryCodeInput = (subscriber) => {
            return (e) => {
                ExtendableObject._allowToNotifyCountryCodeSubscribers = false;
                ExtendableObject.setCountryCode(subscriber.value);
                ExtendableObject._allowToNotifyCountryCodeSubscribers = true;

                if (ExtendableObject.hasLoadedExtension('SubdivisionCodeExtension')) {
                    if ((ExtendableObject._subscribers.subdivisionCode.length > 0)) {
                        ExtendableObject._subdivisionCode = '';
                        ExtendableObject._subscribers.subdivisionCode.forEach(function (subscriber) {
                            subscriber.value = '';
                        });
                    }
                }

                if (ExtendableObject.active) {
                    ExtendableObject._changed = true;
                    ExtendableObject.addressStatus = [];
                }
            };
        };

        /**
         * Callback for blur events on the country code field
         * @param {Object} subscriber - The subscriber object that triggered the blur
         * @returns {Function} Event handler function
         */
        ExtendableObject.cb.countryCodeBlur = (subscriber) => {
            return (e) => {
                if (ExtendableObject.type === 'address') {
                    ExtendableObject.waitUntilReady().then(function () {
                        if (ExtendableObject.onBlurTimeout) {
                            clearTimeout(ExtendableObject.onBlurTimeout);
                            ExtendableObject.onBlurTimeout = null;
                        }
                        ExtendableObject.onBlurTimeout = setTimeout(function () {
                            if (ExtendableObject.config.trigger.onblur &&
                                !ExtendableObject.anyActive() &&
                                ExtendableObject.util.shouldBeChecked() &&
                                !window.EnderecoIntegrator.hasSubmit
                            ) {
                                // Second. Check Address.
                                ExtendableObject.onBlurTimeout = null;
                                ExtendableObject.util.checkAddress().catch();
                            }
                        }, ExtendableObject.config.ux.delay.onBlur);
                    }).catch();
                }
            };
        };
    },

    /**
     * Registers utility functions for country code operations
     * @param {Object} ExtendableObject - The object to extend
     */
    registerUtilities: (ExtendableObject) => {
        // Doesn't exist yet.
    },

    /**
     * Registers API handlers for country code operations
     * @param {Object} ExtendableObject - The object to extend
     */
    registerAPIHandlers: (ExtendableObject) => {
        // Doesn't exist yet.
    },

    /**
     * Registers filter callbacks for country code validation
     * @param {Object} ExtendableObject - The object to extend
     */
    registerFilterCallbacks: (ExtendableObject) => {
        // Add a setter callback promise.
        ExtendableObject.cb.setCountryCode = (countryCode) => {
            return Promise.resolve(countryCode);
        };
    },

    /**
     * Extends the provided object with country code functionality
     * @param {Object} ExtendableObject - The object to extend
     * @returns {Promise<Object>} The CountryCodeExtension object
     */
    extend: async (ExtendableObject) => {
        await CountryCodeExtension.registerProperties(ExtendableObject);
        await CountryCodeExtension.registerFields(ExtendableObject);
        await CountryCodeExtension.registerConfig(ExtendableObject);
        await CountryCodeExtension.registerEventCallbacks(ExtendableObject);
        await CountryCodeExtension.registerUtilities(ExtendableObject);
        await CountryCodeExtension.registerAPIHandlers(ExtendableObject);
        await CountryCodeExtension.registerFilterCallbacks(ExtendableObject);

        return CountryCodeExtension;
    }
};

export default CountryCodeExtension;

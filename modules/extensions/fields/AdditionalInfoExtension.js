const AdditionalInfoExtension = {
    name: 'AdditionalInfoExtension',

    /**
     * Registers private properties on the ExtendableObject
     * @param {Object} ExtendableObject - The object to extend with additional properties
     */
    registerProperties: (ExtendableObject) => {
        ExtendableObject._additionalInfo = '';
        ExtendableObject._subscribers.additionalInfo = [];

        ExtendableObject._allowToNotifyAdditionalInfoSubscribers = true;
    },

    /**
     * Registers getters, setters, and field-related methods on the ExtendableObject
     * @param {Object} ExtendableObject - The object to extend with field definitions
     */
    registerFields: (ExtendableObject) => {
        // Add getter and setter for fields.
        Object.defineProperty(ExtendableObject, 'additionalInfo', {
            get: () => {
                return ExtendableObject.getAdditionalInfo();
            },
            set: (value) => {
                ExtendableObject.setAdditionalInfo(value);
            }
        });

        /**
         * Gets the additional info value
         * @returns {string} The current additional info value
         */
        ExtendableObject.getAdditionalInfo = () => {
            return ExtendableObject._additionalInfo;
        };

        /**
         * Sets the additional info value and notifies subscribers if needed
         * @param {string|Promise<string>} value - The value to set or a promise that resolves to the value
         * @returns {Promise<void>}
         */
        ExtendableObject.setAdditionalInfo = async (value) => {
            const needToNotify = ExtendableObject.active &&
                ExtendableObject._allowToNotifyAdditionalInfoSubscribers;

            ExtendableObject._awaits++;

            try {
                const resolvedValue = await ExtendableObject.util.Promise.resolve(value);
                const additionalInfo = await ExtendableObject.cb.setAdditionalInfo(resolvedValue);

                // Early return.
                if (additionalInfo === ExtendableObject._additionalInfo) {
                    return;
                }

                ExtendableObject._additionalInfo = additionalInfo;

                if (needToNotify) {
                    // Inform all subscribers about the change.
                    const notificationProcesses = [];

                    ExtendableObject._subscribers.additionalInfo.forEach((subscriber) => {
                        notificationProcesses.push(subscriber.updateDOMValue(additionalInfo));
                    });
                    await Promise.all(notificationProcesses);
                }
            } catch (e) {
                console.warn("Error while setting the field 'additionalInfo'", e);
            } finally {
                ExtendableObject._awaits--;
            }
        };

        ExtendableObject.fieldNames.push('additionalInfo');
    },

    /**
     * Registers configuration options for the ExtendableObject
     * @param {Object} ExtendableObject - The object to extend with configuration
     */
    registerConfig: (ExtendableObject) => {
        // There are non atm.
    },

    /**
     * Registers event callbacks for the ExtendableObject
     * @param {Object} ExtendableObject - The object to extend with event callbacks
     */
    registerEventCallbacks: (ExtendableObject) => {
        /**
         * Callback for handling input events on additionalInfo fields
         * @param {Object} subscriber - The subscriber object
         * @returns {Function} Event handler function
         */
        ExtendableObject.cb.additionalInfoInput = (subscriber) => {
            return (e) => {
                ExtendableObject._allowToNotifyAdditionalInfoSubscribers = false;
                ExtendableObject.additionalInfo = subscriber.value;
                ExtendableObject._allowToNotifyAdditionalInfoSubscribers = true;

                if (ExtendableObject.active) {
                    ExtendableObject.util.invalidateAddressMeta();
                }
            };
        };

        /**
         * Callback for handling change events on additionalInfo fields
         * @param {Object} subscriber - The subscriber object
         * @returns {Function} Event handler function
         */
        ExtendableObject.cb.additionalInfoChange = (subscriber) => {
            return (e) => {
                ExtendableObject._allowToNotifyAdditionalInfoSubscribers = false;
                ExtendableObject.additionalInfo = subscriber.value;
                ExtendableObject._allowToNotifyAdditionalInfoSubscribers = true;

                if (ExtendableObject.active) {
                    ExtendableObject.util.invalidateAddressMeta();
                }
            };
        };

        /**
         * Callback for handling blur events on additionalInfo fields
         * Schedules an address check after a delay if conditions are met
         * @param {Object} subscriber - The subscriber object
         * @returns {Function} Event handler function
         */
        ExtendableObject.cb.additionalInfoBlur = (subscriber) => {
            return async (e) => {
                try {
                    await ExtendableObject.waitUntilReady();
                    await ExtendableObject.cb.handleFormBlur();
                } catch (error) {
                    console.warn('Error in additionalInfoBlur handler:', error);
                }
            };
        };
    },

    /**
     * Registers utility functions for the ExtendableObject
     * @param {Object} ExtendableObject - The object to extend with utilities
     */
    registerUtilities: (ExtendableObject) => {
        // There are none atm.
    },

    /**
     * Registers API handlers for the ExtendableObject
     * @param {Object} ExtendableObject - The object to extend with API handlers
     */
    registerAPIHandlers: (ExtendableObject) => {
        // There are none atm.
    },

    /**
     * Registers filter callbacks for the ExtendableObject
     * @param {Object} ExtendableObject - The object to extend with filter callbacks
     */
    registerFilterCallbacks: (ExtendableObject) => {
        ExtendableObject.cb.setAdditionalInfo = (additionalInfo) => additionalInfo;
    },

    /**
     * Main extension method that applies all registered components to the ExtendableObject
     * @param {Object} ExtendableObject - The object to extend
     * @returns {Promise<Object>} Promise resolving to the extension object
     */
    extend: async (ExtendableObject) => {
        await AdditionalInfoExtension.registerProperties(ExtendableObject);
        await AdditionalInfoExtension.registerFields(ExtendableObject);
        await AdditionalInfoExtension.registerConfig(ExtendableObject);
        await AdditionalInfoExtension.registerEventCallbacks(ExtendableObject);
        await AdditionalInfoExtension.registerUtilities(ExtendableObject);
        await AdditionalInfoExtension.registerAPIHandlers(ExtendableObject);
        await AdditionalInfoExtension.registerFilterCallbacks(ExtendableObject);

        return AdditionalInfoExtension;
    }
};

export default AdditionalInfoExtension;

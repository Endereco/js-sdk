const SubdivisionCodeExtension = {
    name: 'SubdivisionCodeExtension',

    /**
     * Registers required properties on the extendable object
     * @param {Object} ExtendableObject - The object to extend with subdivision code properties
     */
    registerProperties: (ExtendableObject) => {
        ExtendableObject._subdivisionCode = ''; // Germany is a preselected default.
        ExtendableObject._subscribers.subdivisionCode = [];

        ExtendableObject._allowToNotifySubdivisionCodeSubscribers = true;
    },

    /**
     * Registers fields and their accessor methods on the extendable object
     * @param {Object} ExtendableObject - The object to extend with subdivision code fields
     */
    registerFields: (ExtendableObject) => {
        // Add getter and setter for fields.
        Object.defineProperty(ExtendableObject, 'subdivisionCode', {
            get: () => {
                return ExtendableObject.getSubdivisionCode();
            },
            set: async (value) => {
                await ExtendableObject.setSubdivisionCode(value);
            }
        });

        /**
         * Gets the current subdivision code
         * @returns {string} The current subdivision code
         */
        ExtendableObject.getSubdivisionCode = () => {
            return ExtendableObject._subdivisionCode;
        };

        /**
         * Sets the subdivision code and notifies subscribers if needed
         * @param {string|Promise<string>} subdivisionCode - The new subdivision code or a promise resolving to it
         * @returns {Promise<void>} A promise that resolves when the subdivision code is set
         */
        ExtendableObject.setSubdivisionCode = async (subdivisionCode) => {
            const needToNotify = ExtendableObject.active && ExtendableObject._allowToNotifySubdivisionCodeSubscribers;

            ExtendableObject._awaits++;

            try {
                let resolvedValue = await ExtendableObject.util.Promise.resolve(subdivisionCode);

                resolvedValue = await ExtendableObject.cb.setSubdivisionCode(resolvedValue);

                // Early return.
                if (resolvedValue === ExtendableObject._subdivisionCode) {
                    return;
                }

                ExtendableObject._subdivisionCode = resolvedValue;

                if (needToNotify) {
                    // Inform all subscribers about the change.
                    const notificationProcesses = [];

                    ExtendableObject._subscribers.subdivisionCode.forEach((subscriber) => {
                        notificationProcesses.push(subscriber.updateDOMValue(resolvedValue));
                    });
                    await Promise.all(notificationProcesses);
                }
            } catch (e) {
                console.warn("Error while setting the field 'subdivisionCode'", e);
            } finally {
                ExtendableObject._awaits--;
            }
        };
        // Add country code to field names list.
        ExtendableObject.fieldNames.push('subdivisionCode');
    },

    /**
     * Registers any configuration settings for subdivision code handling
     * @param {Object} ExtendableObject - The object to extend with configuration
     */
    registerConfig: (ExtendableObject) => {
        // Doesn't have any at the moment.
    },

    /**
     * Registers event callback handlers for subdivision code-related events
     * @param {Object} ExtendableObject - The object to extend with event callbacks
     */
    registerEventCallbacks: (ExtendableObject) => {
        /**
         * Handles subdivision code change events
         * @param {Object} subscriber - The subscriber object that triggered the change
         * @returns {Function} Event handler function
         */
        ExtendableObject.cb.subdivisionCodeChange = (subscriber) => {
            return (e) => {
                ExtendableObject._allowToNotifySubdivisionCodeSubscribers = false;
                ExtendableObject.subdivisionCode = subscriber.value;
                ExtendableObject._allowToNotifySubdivisionCodeSubscribers = true;

                if (ExtendableObject.active) {
                    ExtendableObject.util.invalidateAddressMeta();
                }
            };
        };

        /**
         * Handles subdivision code input events
         * @param {Object} subscriber - The subscriber object that triggered the input
         * @returns {Function} Event handler function
         */
        ExtendableObject.cb.subdivisionCodeInput = (subscriber) => {
            return (e) => {
                ExtendableObject._allowToNotifySubdivisionCodeSubscribers = false;
                ExtendableObject.subdivisionCode = subscriber.value;
                ExtendableObject._allowToNotifySubdivisionCodeSubscribers = true;

                if (ExtendableObject.active) {
                    ExtendableObject.util.invalidateAddressMeta();
                }
            };
        };

        /**
         * Handles blur events on subdivision code fields
         * @param {Object} subscriber - The subscriber object related to the field
         * @returns {Function} Event handler function for blur events
         */
        ExtendableObject.cb.subdivisionCodeBlur = (subscriber) => {
            return async (e) => {
                try {
                    await ExtendableObject.waitUntilReady();
                    await ExtendableObject.cb.handleFormBlur();
                } catch (error) {
                    console.warn('Error in subdivisionCodeBlur handler:', error);
                }
            };
        };
    },

    /**
     * Registers utility functions for subdivision code handling
     * @param {Object} ExtendableObject - The object to extend with utilities
     */
    registerUtilities: (ExtendableObject) => {
        // Doesn't have any at the moment.
    },

    /**
     * Registers API handlers for subdivision code operations
     * @param {Object} ExtendableObject - The object to extend with API handlers
     */
    registerAPIHandlers: (ExtendableObject) => {
        // Doesn't have any at the moment.
    },

    /**
     * Registers filter callbacks for processing subdivision code values
     * @param {Object} ExtendableObject - The object to extend with filter callbacks
     */
    registerFilterCallbacks: (ExtendableObject) => {
        // Add a setter callback promise.
        ExtendableObject.cb.setSubdivisionCode = (subdivisionCode) => subdivisionCode;
    },

    /**
     * Extends the provided object with all subdivision code functionality
     * @param {Object} ExtendableObject - The object to extend
     * @returns {Promise<Object>} A promise that resolves to the extension object
     */
    extend: async (ExtendableObject) => {
        await SubdivisionCodeExtension.registerProperties(ExtendableObject);
        await SubdivisionCodeExtension.registerFields(ExtendableObject);
        await SubdivisionCodeExtension.registerConfig(ExtendableObject);
        await SubdivisionCodeExtension.registerEventCallbacks(ExtendableObject);
        await SubdivisionCodeExtension.registerUtilities(ExtendableObject);
        await SubdivisionCodeExtension.registerAPIHandlers(ExtendableObject);
        await SubdivisionCodeExtension.registerFilterCallbacks(ExtendableObject);

        return SubdivisionCodeExtension;
    }
};

export default SubdivisionCodeExtension;

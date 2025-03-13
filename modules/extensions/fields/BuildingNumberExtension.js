/**
 * Extends the base object with "buildingNumber" field handling capabilities.
 * Adds support for building number input with:
 * - Adding buildingNumber property with getter/setter
 * - Syncing with streetFull when combined with street name
 * - Basic event handling for input and validation
 * - Simple value processing and filtering
 */

const BuildingNumberExtension = {
    name: 'BuildingNumberExtension',

    /**
     * Place for registering internal properties needed for buildingNumber functionality.
     * Add here:
     * - Internal storage fields (_fieldName)
     * - Subscriber arrays (_subscribers.fieldName)
     * - Control flags for field behavior
     * @param {Object} ExtendableObject - The base object being extended
     */
    registerProperties: (ExtendableObject) => {
        ExtendableObject._buildingNumber = '';
        ExtendableObject._subscribers.buildingNumber = [];

        // Flags
        ExtendableObject._allowToNotifyBuildingNumberSubscribers = true;
    },

    /**
     * Place for registering fields that should be exposed on the ExtendableObject.
     * Add here:
     * - Public properties with getters/setters
     * - Field tracking registration
     * - Property change handling logic
     * @param {Object} ExtendableObject - The base object being extended
     */
    registerFields: (ExtendableObject) => {
        // Add getter and setter for fields.
        Object.defineProperty(ExtendableObject, 'buildingNumber', {
            get: () => ExtendableObject.getBuildingNumber(),
            set: async (value) => {
                await ExtendableObject.setBuildingNumber(value);
            }
        });

        ExtendableObject.getBuildingNumber = () => {
            return ExtendableObject._buildingNumber;
        };

        ExtendableObject.setBuildingNumber = async (value) => {
            const needToNotify = ExtendableObject.active &&
                ExtendableObject._allowToNotifyBuildingNumberSubscribers;
            const needToUpdateStreetFull = ExtendableObject.active && ExtendableObject._allowStreetFullCompose;

            ExtendableObject._awaits++;

            try {
                const resolvedValue = await ExtendableObject.util.Promise.resolve(value);
                const buildingNumber = await ExtendableObject.cb.setBuildingNumber(resolvedValue);

                // Early return.
                if (buildingNumber === ExtendableObject._buildingNumber) {
                    return;
                }

                ExtendableObject._buildingNumber = buildingNumber;

                if (needToNotify) {
                    // Inform all subscribers about the change.
                    const notificationProcesses = [];

                    ExtendableObject._subscribers.buildingNumber.forEach((subscriber) => {
                        notificationProcesses.push(subscriber.updateDOMValue(buildingNumber));
                    });
                    await Promise.all(notificationProcesses);
                }

                if (needToUpdateStreetFull) {
                    await ExtendableObject.util.ensureStreetFullIntegrity(
                        ExtendableObject.countryCode,
                        ExtendableObject.streetName,
                        buildingNumber
                    );
                }
            } catch (e) {
                console.warn("Error while setting the field 'buildingNumber'", e);
            } finally {
                ExtendableObject._awaits--;
            }
        };

        ExtendableObject.fieldNames.push('buildingNumber');
    },

    /**
     * Place for registering event-related callback functions.
     * Add here:
     * - Event handlers (onChange, onInput, onBlur, etc.)
     * - Event propagation control
     * - Event-triggered state updates
     * @param {Object} ExtendableObject - The base object being extended
     */
    registerEventCallbacks: (ExtendableObject) => {
        /**
         * Handler for building number changes (field not in focus)
         * @param {Object} subscriber - The subscriber object that triggered the change
         * @returns {Function} Event handler that updates buildingNumber while preventing circular updates
         */
        ExtendableObject.cb.buildingNumberChange = (subscriber) => () => {
            ExtendableObject._allowToNotifyBuildingNumberSubscribers = false;
            ExtendableObject.buildingNumber = subscriber.value;
            ExtendableObject._allowToNotifyBuildingNumberSubscribers = true;

            if (ExtendableObject.active) {
                ExtendableObject.util.invalidateAddressMeta();
            }
        };

        /**
         * Handler for building number changes (field in focus)
         * @param {Object} subscriber - The subscriber object that triggered the input
         * @returns {Function} Event handler that updates buildingNumber while preventing circular updates
         */
        ExtendableObject.cb.buildingNumberInput = (subscriber) => () => {
            ExtendableObject._allowToNotifyBuildingNumberSubscribers = false;
            ExtendableObject.buildingNumber = subscriber.value;
            ExtendableObject._allowToNotifyBuildingNumberSubscribers = true;

            if (ExtendableObject.active) {
                ExtendableObject.util.invalidateAddressMeta();
            }
        };

        /**
         * Handler for field blur events
         * @returns {Function} Event handler that manages validation timing
         * - Handles validation scheduling
         * - Manages field state on blur
         * - Triggers address checks when needed
         */
        ExtendableObject.cb.buildingNumberBlur = function () {
            return async () => {
                try {
                    await ExtendableObject.waitUntilReady();
                    await ExtendableObject.cb.handleFormBlur();
                } catch (error) {
                    console.warn('Error in buildingNumberBlur handler:', error);
                }
            };
        };
    },

    /**
     * Place for registering utility functions used across the extension.
     * Add here:
     * - Data processing helpers
     * - State management utilities
     * - Formatting functions
     * Note: Currently empty as building number handling is straightforward.
     * @param {Object} ExtendableObject - The base object being extended
     */
    registerUtilities: () => {
        // Doesn't provide any new utility functions.
    },

    /**
     * Place for registering API communication functions.
     * Add here:
     * - API request functions
     * - Response handling
     * - Error management
     * Note: Currently empty as building number doesn't require API communication.
     * @param {Object} ExtendableObject - The base object being extended
     */
    registerAPIHandlers: () => {
        // Doesn't provide any new API functions.
    },

    /**
     * Place for registering data transformation and validation functions.
     * Add here:
     * - Input filters
     * - Data validators
     * - Value transformers
     * @param {Object} ExtendableObject - The base object being extended
     */
    registerFilterCallbacks: (ExtendableObject) => {
        ExtendableObject.cb.setBuildingNumber = (buildingNumber) => buildingNumber;
    },

    /**
     * Place for registering templates and UI configuration.
     * Add here:
     * - HTML templates
     * - UI configuration
     * - Display format templates
     * Note: Currently empty as building number doesn't require special templates.
     * @param {Object} ExtendableObject - The base object being extended
     */
    registerConfig: () => {
        // Doesn't have any configs.
    },

    /**
     * Main extension function that sets up all buildingNumber functionality.
     * @param {Object} ExtendableObject - The base object being extended
     * @returns {Promise<Object>} - Resolves to the BuildingNumberExtension object
     *
     * Executes all registration functions in sequence:
     * 1. registerProperties - Sets up internal state
     * 2. registerFields - Adds buildingNumber field
     * 3. registerConfig - Sets up templates (empty)
     * 4. registerEventCallbacks - Adds event handlers
     * 5. registerUtilities - Adds helper functions (empty)
     * 6. registerAPIHandlers - Sets up API communication (empty)
     * 7. registerFilterCallbacks - Adds data filters
     *
     * All registrations are handled asynchronously to ensure proper setup.
     * The extension object is returned to confirm successful extension.
     */
    extend: async (ExtendableObject) => {
        await BuildingNumberExtension.registerProperties(ExtendableObject);
        await BuildingNumberExtension.registerFields(ExtendableObject);
        await BuildingNumberExtension.registerConfig(ExtendableObject);
        await BuildingNumberExtension.registerEventCallbacks(ExtendableObject);
        await BuildingNumberExtension.registerUtilities(ExtendableObject);
        await BuildingNumberExtension.registerAPIHandlers(ExtendableObject);
        await BuildingNumberExtension.registerFilterCallbacks(ExtendableObject);

        return BuildingNumberExtension;
    }
};

export default BuildingNumberExtension;

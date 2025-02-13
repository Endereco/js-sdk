/**
 * Extends the base object with "streetName" field handling capabilities.
 * Adds support for street name input with:
 * - Adding streetName property with getter/setter
 * - Providing autocomplete suggestions for street names
 * - Syncing with streetFull when combined with building number
 * - Caching API results for performance
 * - Handling keyboard navigation for autocomplete suggestions
 */

import streetFullTemplateFactory from "../../../templates/streetNameTemplates";
import {diffChars} from "diff";
import streetNamePredictionsTemplate from "../../../templates/street_name_predictions.html";

const StreetNameExtension = {
    name: 'StreetNameExtension',

    /**
     * Place for registering internal properties needed for streetName functionality.
     * Add here:
     * - Internal storage fields (_fieldName)
     * - Subscriber arrays (_subscribers.fieldName)
     * - Cache objects for API results
     * - Control flags for field behavior
     * - Timeout and sequence tracking variables
     * @param {Object} ExtendableObject - The base object being extended
     */
    registerProperties: (ExtendableObject) => {
        // Internal storage for field values
        ExtendableObject._streetName = '';
        ExtendableObject._streetNamePredictions = [];

        // Subscriber storage
        ExtendableObject._subscribers.streetName = [];

        // Cache
        ExtendableObject.streetNameAutocompleteCache = {
            cachedResults: {}
        };

        // Flags
        ExtendableObject._allowToNotifyStreetNameSubscribers = true;
        ExtendableObject._allowFetchStreetNameAutocomplete = true;

        // Timeout and sequence
        ExtendableObject._streetFullComposeTimeout = null;
        ExtendableObject._streetNameAutocompleteTimeout = null;
        ExtendableObject._streetNameAutocompleteRequestIndex = 0;
        ExtendableObject._streetNamePredictionsIndex = 0;
    },

    /**
     * Place for registering fields that should be exposed on the ExtendableObject.
     * Add here:
     * - Public properties with getters/setters
     * - Field tracking registration
     * - Property change handling logic
     * - Prediction management properties
     * @param {Object} ExtendableObject - The base object being extended
     */
    registerFields: (ExtendableObject) => {
        Object.defineProperty(ExtendableObject, 'streetName', {
            get: () => {
                return ExtendableObject._streetName;
            },
            set: async (value) => {
                const needToNotify = ExtendableObject.active && ExtendableObject._allowToNotifyStreetNameSubscribers;
                const needToDisplayAutocompleteDropdown = ExtendableObject.active &&
                    ExtendableObject.config.useAutocomplete &&
                    ExtendableObject._allowFetchStreetNameAutocomplete;
                const needToUpdateStreetFull = ExtendableObject.active && ExtendableObject._allowStreetFullCompose;

                ExtendableObject._awaits++;

                try {
                    let resolvedValue = await ExtendableObject.util.Promise.resolve(value);
                    const streetName = await ExtendableObject.cb.setStreetName(resolvedValue);

                    // Early return.
                    if (streetName === ExtendableObject._streetName) {
                        return;
                    }

                    ExtendableObject._streetName = streetName;

                    if (ExtendableObject.active) {
                        ExtendableObject._changed = true;
                        ExtendableObject.addressStatus = [];
                    }

                    if (needToNotify) {
                        // Inform all subscribers about the change.
                        ExtendableObject._subscribers.streetName.forEach((subscriber) => {
                            subscriber.value = streetName;
                        });
                    }

                    if (needToUpdateStreetFull) {
                        await ExtendableObject.util.ensureStreetFullIntegrity(
                            ExtendableObject.countryCode,
                            streetName,
                            ExtendableObject.buildingNumber
                        )
                    }

                    if (needToDisplayAutocompleteDropdown) {
                        await ExtendableObject.util.displayStreetNameAutocompleteDropdown(streetName);
                    }
                } catch(e) {
                    console.warn("Error while setting the field 'streetName'", e);
                } finally {
                    ExtendableObject._awaits--;
                }
            }
        });
        ExtendableObject.fieldNames.push('streetName');

        Object.defineProperty(ExtendableObject, 'streetNamePredictions', {
            get: () => {
                return ExtendableObject._streetNamePredictions;
            },
            set: async (value) => {
                let resolvedValue = await ExtendableObject.util.Promise.resolve(value);
                if (ExtendableObject.streetNamePredictions !== resolvedValue) {
                    ExtendableObject._streetNamePredictions = resolvedValue;
                    ExtendableObject._streetNamePredictionsIndex = 0;
                }
            }
        });
    },

    /**
     * Place for registering event-related callback functions.
     * Add here:
     * - Event handlers (onChange, onInput, onBlur, etc.)
     * - Keyboard interaction handlers
     * - Event propagation control
     * - Event-triggered state updates
     * @param {Object} ExtendableObject - The base object being extended
     */
    registerEventCallbacks: (ExtendableObject) => {

        /**
         * Handler for street name changes (field not in focus)
         * @param {Object} subscriber - The subscriber object that triggered the change
         * @returns {Function} Event handler that updates streetName while preventing circular updates
         */
        ExtendableObject.cb.streetNameChange = (subscriber) => {
            return () => {
                ExtendableObject._allowToNotifyStreetNameSubscribers = false;
                ExtendableObject.streetName = subscriber.value;
                ExtendableObject._allowToNotifyStreetNameSubscribers = true;
            }
        };

        /**
         * Handler for street name changes via direct input (field in focus)
         * @param {Object} subscriber - The subscriber object that triggered the input
         * @returns {Function} Event handler that updates streetName while preventing circular updates
         */
        ExtendableObject.cb.streetNameInput = (subscriber) => {
            return () => {
                ExtendableObject._allowToNotifyStreetNameSubscribers = false;
                ExtendableObject.streetName = subscriber.value;
                ExtendableObject._allowToNotifyStreetNameSubscribers = true;
            }
        };

        /**
         * Handler for field blur events
         * @returns {Function} Event handler that manages validation and dropdown cleanup
         * - Cleans up predictions dropdown
         * - Handles validation timing
         * - Manages field state on blur
         */
        ExtendableObject.cb.streetNameBlur = () => {
            return async () => {
                try {
                    // Handle dropdown cleanup
                    const isAnyActive = ExtendableObject._subscribers.streetName.some(
                        sub => document.activeElement === sub.object
                    );

                    if (!isAnyActive) {
                        ExtendableObject.streetNamePredictions = [];
                        ExtendableObject.util.removeStreetNamePredictionsDropdown();
                    }

                    await ExtendableObject.waitUntilReady();

                    // Clear existing timeout if any
                    if (ExtendableObject.onBlurTimeout) {
                        clearTimeout(ExtendableObject.onBlurTimeout);
                        ExtendableObject.onBlurTimeout = null;
                    }

                    // Set new timeout for address check
                    ExtendableObject.onBlurTimeout = setTimeout(async () => {
                        const shouldCheckAddress = ExtendableObject.config.trigger.onblur &&
                            !ExtendableObject.anyActive() &&
                            ExtendableObject.util.shouldBeChecked() &&
                            !window.EnderecoIntegrator.hasSubmit;

                        if (shouldCheckAddress) {
                            clearTimeout(ExtendableObject.onBlurTimeout);
                            ExtendableObject.onBlurTimeout = null;
                            try {
                                await ExtendableObject.util.checkAddress();
                            } catch (error) {
                                console.warn('Error checking address:', error);
                            }
                        }
                    }, 300);


                } catch (error) {
                    console.warn('Error in streetNameBlur handler:', error);
                }
            };
        };

        /**
         * Handler for keyboard events on the streetName field
         * @returns {Function} Event handler for keyboard navigation
         * - Handles up/down arrows for prediction navigation
         * - Handles enter for prediction selection
         * - Handles backspace for smartFill control
         */
        ExtendableObject.cb.streetNameKeydown = function() {
            return function(e) {
                if ('ArrowUp' === e.key || 'Up' === e.key) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (-1 < ExtendableObject._streetNamePredictionsIndex) {
                        ExtendableObject._streetNamePredictionsIndex = ExtendableObject._streetNamePredictionsIndex - 1;
                        ExtendableObject.util.renderStreetNamePredictionsDropdown(
                            ExtendableObject.streetNamePredictions
                        );
                    }
                } else if ('ArrowDown' === e.key || 'Down' === e.key) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (ExtendableObject._streetNamePredictionsIndex < (ExtendableObject._streetNamePredictions.length-1)) {
                        ExtendableObject._streetNamePredictionsIndex = ExtendableObject._streetNamePredictionsIndex + 1;
                        ExtendableObject.util.renderStreetNamePredictionsDropdown(
                            ExtendableObject.streetNamePredictions
                        );
                    }
                } else if ('Tab' === e.key || 'Tab' === e.key) {
                    // TODO: configurable activate in future releases.
                    /*
                    if (0 < ExtendableObject._streetNamePredictions.length) {
                        e.preventDefault();
                        e.stopPropagation();
                        ExtendableObject.cb.copyStreetNameFromPrediction();
                    }*/
                } else if ('Enter' === e.key || 'Enter' === e.key) {
                    if (0 < ExtendableObject._streetNamePredictions.length) {
                        e.preventDefault();
                        e.stopPropagation();

                        ExtendableObject._allowFetchStreetNameAutocomplete = false;
                        ExtendableObject.streetName = ExtendableObject.streetNamePredictions[ExtendableObject._streetNamePredictionsIndex].streetName;
                        ExtendableObject.streetNamePredictions = [];
                        ExtendableObject._allowFetchStreetNameAutocomplete = true;
                        ExtendableObject.util.removeStreetNamePredictionsDropdown();
                    }
                } else if('Backspace' === e.key || 'Backspace' === e.key) {
                    ExtendableObject.config.ux.smartFill = false;
                }
            }
        };
    },

    /**
     * Place for registering utility functions used across the extension.
     * Add here:
     * - UI manipulation functions
     * - Data processing helpers
     * - State management utilities
     * - Formatting functions
     * @param {Object} ExtendableObject - The base object being extended
     */
    registerUtilities: (ExtendableObject) => {

        /**
         * Manages the display of street name autocomplete suggestions dropdown
         * @param {string} streetName - Current street name input value
         * @returns {Promise<void>}
         */
        ExtendableObject.util.displayStreetNameAutocompleteDropdown = async (streetName) => {
            ExtendableObject.util.removeStreetNamePredictionsDropdown();

            if (ExtendableObject._streetNameAutocompleteTimeout) {
                clearTimeout(ExtendableObject._streetNameAutocompleteTimeout)
            }

            ExtendableObject._streetNameAutocompleteTimeout = setTimeout(async () => {
                try {
                    const autocompleteResult = await ExtendableObject.util.getStreetNamePredictions(streetName);

                    if (autocompleteResult.originalStreetName !== streetName) {
                        return;
                    }
                    ExtendableObject.streetNamePredictions = autocompleteResult.predictions;

                    ExtendableObject.util.renderStreetNamePredictionsDropdown(autocompleteResult.predictions);
                } catch (e) {
                    console.warn("Failed fetching predictions", e, streetName);
                }
                ExtendableObject._streetNameAutocompleteTimeout = null;
            }, ExtendableObject.config.ux.delay.inputAssistant);
        }

        /**
         * Renders the street name predictions dropdown with diff highlighting
         * @param {Array} predictions - Array of street name predictions
         * Handles:
         * - Dropdown positioning
         * - Diff highlighting for suggestions
         * - Event listeners for selection
         */
        ExtendableObject.util.renderStreetNamePredictionsDropdown = (predictions) => {
            predictions = JSON.parse(JSON.stringify(predictions)); // Create a copy

            // Render dropdown under the input element
            ExtendableObject._subscribers.streetName.forEach( (subscriber) => {
                if (document.querySelector('[endereco-street-name-predictions]')) {
                    ExtendableObject._openDropdowns--;
                    document.querySelector('[endereco-street-name-predictions]').parentNode.removeChild(document.querySelector('[endereco-street-name-predictions]'));
                }

                // Render predictions only if the field is active and there are predictions.
                if (
                    0 < predictions.length &&
                    (document.activeElement === subscriber.object)
                ) {
                    var startingIndex = 0;
                    var preparedPredictions = [];

                    // Prepare predictions.
                    predictions.forEach(function(prediction) {
                        var diff = diffChars(ExtendableObject.streetName, prediction.streetName, {ignoreCase: true});
                        var streetNameHtml = '';
                        diff.forEach(function(part){
                            var markClass = part.added ? 'endereco-span--add' :
                                part.removed ? 'endereco-span--remove' : 'endereco-span--neutral';
                            streetNameHtml += '<span class="' + markClass + '">' + part.value.replace(/[ ]/g,  '&nbsp;') + '</span>';
                        });

                        preparedPredictions.push({
                            streetName: prediction.streetName,
                            streetNameDiff: streetNameHtml
                        });
                    })

                    // Prepare dropdown.
                    var predictionsHtml = ExtendableObject.util.Mustache.render(ExtendableObject.config.templates.streetNamePredictions, {
                        ExtendableObject: ExtendableObject,
                        predictions: preparedPredictions,
                        offsetTop: subscriber.object.offsetTop + subscriber.object.offsetHeight,
                        offsetLeft: subscriber.object.offsetLeft,
                        width: subscriber.object.offsetWidth,
                        direction: getComputedStyle(subscriber.object).direction,
                        longList: (preparedPredictions.length > 6),
                        index: function() {
                            return (startingIndex-1); // TODO: add loop finishing function to increase counter.
                        },
                        isActive: function(){
                            var isActive = (startingIndex === ExtendableObject._streetNamePredictionsIndex);
                            startingIndex++;
                            return isActive;
                        }
                    });

                    // Attach it to HTML.
                    subscriber.object.insertAdjacentHTML('afterend', predictionsHtml);
                    ExtendableObject._openDropdowns++;
                    document.querySelectorAll('[data-id="'+ExtendableObject.id+'"] [endereco-street-name-prediction]').forEach(function(DOMElement) {
                        DOMElement.addEventListener('mousedown', function(e) {
                            var index = parseInt(this.getAttribute('data-prediction-index'))
                            e.preventDefault();
                            e.stopPropagation();
                            ExtendableObject._allowFetchStreetNameAutocomplete = false;
                            ExtendableObject.streetName = predictions[index].streetName;
                            ExtendableObject.streetNamePredictions = [];
                            ExtendableObject._allowFetchStreetNameAutocomplete = true;
                            ExtendableObject.util.removeStreetNamePredictionsDropdown();
                        })
                    });
                }
            });
        }

        /**
         * Removes the street name predictions dropdown from the DOM
         * Updates the dropdown counter and cleans up related state
         */

        ExtendableObject.util.removeStreetNamePredictionsDropdown = () => {
            ExtendableObject._subscribers.streetName.forEach(() => {
                const dropdown = document.querySelector('[endereco-street-name-predictions]');
                if (dropdown) {
                    ExtendableObject._openDropdowns--;
                    dropdown.parentNode.removeChild(dropdown);
                }
            });
        }

        /**
         * Ensures street full is properly composed from name and number
         * @param {string} countryCode - Country code for formatting
         * @param {string} streetName - Street name component
         * @param {string} buildingNumber - Building number component
         * @returns {Promise<void>}
         */
        ExtendableObject.util.ensureStreetFullIntegrity = async function(countryCode, streetName, buildingNumber) {
            if (ExtendableObject._streetFullComposeTimeout) {
                clearTimeout(ExtendableObject._streetFullComposeTimeout)
            }

            ExtendableObject._streetFullComposeTimeout = setTimeout(async () => {
                try {
                    const streetFull = ExtendableObject.util.Mustache.render(
                        ExtendableObject.config.templates.streetFull.getTemplate(countryCode),
                        {
                            streetName: streetName,
                            buildingNumber: buildingNumber
                        }
                    ).replace(/  +/g, ' ').replace(/(\r\n|\n|\r)/gm, "").trim();

                    // Check if result is outdated
                    if ((ExtendableObject.streetName !== streetName) || (ExtendableObject.buildingNumber !== buildingNumber)) {
                        return;
                    }

                    ExtendableObject._allowStreetFullSplit = false;
                    ExtendableObject._allowFetchStreetFullAutocomplete = false;
                    ExtendableObject.streetFull = streetFull;
                    ExtendableObject._allowStreetFullSplit = true;
                    ExtendableObject._allowFetchStreetFullAutocomplete = true;
                } catch (e) {
                    console.warn("Street compose failed", e, countryCode, streetName, buildingNumber,)
                }
                ExtendableObject._streetFullComposeTimeout = null;
            }, ExtendableObject.config.ux.delay.inputAssistant);
        }
    },

    /**
     * Place for registering API communication functions.
     * Add here:
     * - API request functions
     * - Response handling
     * - Error management
     * - Caching logic
     * @param {Object} ExtendableObject - The base object being extended
     */
    registerAPIHandlers: (ExtendableObject) => {

        /**
         * Fetches street name predictions from API
         * @param {string} streetNameRaw - Raw street name input to get predictions for
         * @returns {Promise<Object>} Prediction results with original input
         * @throws {Error} If input is invalid or API request fails
         */
        ExtendableObject.util.getStreetNamePredictions = async function (streetNameRaw) {
            if (typeof streetNameRaw !== "string") {
                throw new Error("Invalid argument. The streetNameRaw has to be a string");
            }

            const streetName = streetNameRaw.trim();
            let autocompleteResult = {
                originalStreetName: streetName,
                predictions: [],
            };

            // Early return
            if (streetName === "") {
                return autocompleteResult;
            }

            if (!ExtendableObject.streetNameAutocompleteCache.cachedResults[streetName]) {
                const autocompleteRequestIndex = ++ExtendableObject._streetNameAutocompleteRequestIndex;

                const message = {
                    jsonrpc: "2.0",
                    id: autocompleteRequestIndex,
                    method: "streetAutocomplete",
                    params: {
                        country: ExtendableObject.countryCode,
                        language: ExtendableObject.config.lang,
                        postCode: ExtendableObject.postalCode,
                        cityName: ExtendableObject.locality,
                        street: streetName,
                        houseNumber: ExtendableObject.buildingNumber
                    },
                };

                const headers = {
                    "X-Auth-Key": ExtendableObject.config.apiKey,
                    "X-Agent": ExtendableObject.config.agentName,
                    "X-Remote-Api-Url": ExtendableObject.config.remoteApiUrl,
                    "X-Transaction-Referer": window.location.href,
                    "X-Transaction-Id": ExtendableObject.hasLoadedExtension?.("SessionExtension")
                        ? ExtendableObject.sessionId
                        : "not_required",
                };

                let streetNamePredictionsTemp = [];

                try {
                    const EnderecoAPI = ExtendableObject.getEnderecoAPI();
                    if (!EnderecoAPI) {
                        console.warn("EnderecoAPI is not available");
                        return autocompleteResult;
                    }

                    let result = await EnderecoAPI.sendRequestToAPI(message, headers);

                    if (result?.data?.error?.code === -32700) {
                        ExtendableObject.util.updateSessionId?.();
                    }

                    if (!result || !result.data || !result.data.result) {
                        console.warn("API didn't return a valid result");
                        return autocompleteResult;
                    }

                    // If session counter is set, increase it.
                    if (ExtendableObject.hasLoadedExtension("SessionExtension")) {
                        ExtendableObject.sessionCounter++;
                    }

                    result.data.result.predictions.forEach((streetNamePrediction) => {
                        if (!streetNamePrediction) return;

                        const { country, street, buildingNumber, additionalInfo } = streetNamePrediction || {};

                        let tempStreetNameContainer = {
                            countryCode: country ?? ExtendableObject._countryCode,
                            streetName: street ?? "",
                            buildingNumber: buildingNumber ?? "",
                            additionalInfo: additionalInfo ?? "",
                        };

                        if (streetNamePrediction.streetFull === undefined) {
                            tempStreetNameContainer.streetFull = ExtendableObject.util.Mustache.render(
                                streetFullTemplateFactory.getTemplate(tempStreetNameContainer.countryCode),
                                {
                                    streetName: tempStreetNameContainer.streetName,
                                    buildingNumber: tempStreetNameContainer.buildingNumber,
                                    additionalInfo: tempStreetNameContainer.additionalInfo,
                                }
                            )
                                .replace(/(\r\n|\n|\r)/gm, "")
                                .trim();
                        }

                        streetNamePredictionsTemp.push(tempStreetNameContainer);
                    });
                } catch (e) {
                    console.warn("Error fetching street full predictions", e);
                }

                ExtendableObject.streetNameAutocompleteCache.cachedResults[streetName] = streetNamePredictionsTemp;
            }

            autocompleteResult.predictions = ExtendableObject.streetNameAutocompleteCache.cachedResults[streetName];

            return autocompleteResult;
        };
    },

    /**
     * Place for registering data transformation and validation functions.
     * Add here:
     * - Input filters
     * - Data validators
     * - Value transformers
     * - Custom formatters
     * @param {Object} ExtendableObject - The base object being extended
     */
    registerFilterCallbacks: (ExtendableObject) => {

        /**
         * Filter function for streetName value processing
         * @param {string} streetName - Street name value to process
         * @returns {Promise<string>} Processed street name value
         */
        ExtendableObject.cb.setStreetName = async (streetName) => {
            return streetName;
        }
    },

    /**
     * Place for registering templates and configuration.
     * Add here:
     * - HTML templates
     * - UI configuration
     * - Display format templates
     * @param {Object} ExtendableObject - The base object being extended
     */
    registerConfig: (ExtendableObject) => {
        ExtendableObject.config.templates.streetNamePredictions = streetNamePredictionsTemplate;
    },

    /**
     * Main extension function that sets up all streetName functionality.
     * @param {Object} ExtendableObject - The base object being extended
     * @returns {Promise<Object>} - Resolves to the StreetNameExtension object
     *
     * Executes all registration functions in sequence:
     * 1. registerProperties - Sets up internal state
     * 2. registerFields - Adds streetName field
     * 3. registerConfig - Sets up templates
     * 4. registerEventCallbacks - Adds event handlers
     * 5. registerUtilities - Adds helper functions
     * 6. registerAPIHandlers - Sets up API communication
     * 7. registerFilterCallbacks - Adds data filters
     *
     * All registrations are handled asynchronously to ensure proper setup.
     * The extension object is returned to confirm successful extension.
     */
    extend: async (ExtendableObject) => {
        await StreetNameExtension.registerProperties(ExtendableObject);
        await StreetNameExtension.registerFields(ExtendableObject);
        await StreetNameExtension.registerConfig(ExtendableObject);
        await StreetNameExtension.registerEventCallbacks(ExtendableObject);
        await StreetNameExtension.registerUtilities(ExtendableObject);
        await StreetNameExtension.registerAPIHandlers(ExtendableObject);
        await StreetNameExtension.registerFilterCallbacks(ExtendableObject);

        return StreetNameExtension;
    }
}

export default StreetNameExtension

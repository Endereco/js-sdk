/**
 * Extends the base object with "streetName" field handling capabilities.
 * Adds support for street name input with:
 * - Adding streetName property with getter/setter
 * - Providing autocomplete suggestions for street names
 * - Syncing with streetFull when combined with building number
 * - Caching API results for performance
 * - Handling keyboard navigation for autocomplete suggestions
 */

import streetFullTemplateFactory from '../../../templates/streetNameTemplates';
import { diffChars } from 'diff';
import streetNamePredictionsTemplate from '../../../templates/street_name_predictions.html';

const MAX_PREDICTIONS_BEFORE_SCROLL = 6;
const ERROR_EXPIRED_SESSION = -32700;

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
        ExtendableObject._allowFetchStreetNameAutocomplete = false;

        // Default values
        ExtendableObject._streetFullPredictionsIndexDefault = -1;

        // Timeout and sequence
        ExtendableObject._streetFullComposeTimeout = null;
        ExtendableObject._streetNameAutocompleteTimeout = null;
        ExtendableObject._streetNameAutocompleteRequestIndex = 0;
        ExtendableObject._streetNamePredictionsIndex = ExtendableObject._streetFullPredictionsIndexDefault;
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
                return ExtendableObject.getStreetName();
            },
            set: async (value) => {
                await ExtendableObject.setStreetName(value);
            }
        });

        ExtendableObject.getStreetName = () => {
            return ExtendableObject._streetName;
        };

        ExtendableObject.setStreetName = async (streetNameValue) => {
            const needToNotify = ExtendableObject.active && ExtendableObject._allowToNotifyStreetNameSubscribers;
            const needToDisplayAutocompleteDropdown = ExtendableObject.active &&
                ExtendableObject.config.useAutocomplete &&
                ExtendableObject._allowFetchStreetNameAutocomplete;
            const needToUpdateStreetFull = ExtendableObject.active && ExtendableObject._allowStreetFullCompose;

            ExtendableObject._awaits++;

            try {
                const resolvedValue = await ExtendableObject.util.Promise.resolve(streetNameValue);
                const streetName = await ExtendableObject.cb.setStreetName(resolvedValue);

                // Early return.
                if (streetName === ExtendableObject._streetName) {
                    return;
                }

                ExtendableObject._streetName = streetName;

                if (needToNotify) {
                    // Inform all subscribers about the change.
                    const notificationProcesses = [];

                    ExtendableObject._subscribers.streetName.forEach((subscriber) => {
                        notificationProcesses.push(subscriber.updateDOMValue(streetName));
                    });
                    await Promise.all(notificationProcesses);
                }

                if (needToUpdateStreetFull) {
                    await ExtendableObject.util.ensureStreetFullIntegrity(
                        ExtendableObject.countryCode,
                        streetName,
                        ExtendableObject.buildingNumber
                    );
                }

                if (needToDisplayAutocompleteDropdown) {
                    // eslint-disable-next-line no-unused-vars
                    const _ = ExtendableObject.util.displayStreetNameAutocompleteDropdown(streetName);
                }
            } catch (e) {
                console.warn("Error while setting the field 'streetName'", e);
            } finally {
                ExtendableObject._awaits--;
            }
        };

        ExtendableObject.fieldNames.push('streetName');

        Object.defineProperty(ExtendableObject, 'streetNamePredictions', {
            get: () => {
                return ExtendableObject.getStreetNamePredictions();
            },
            set: async (value) => {
                await ExtendableObject.setStreetNamePredictions(value);
            }
        });

        ExtendableObject.getStreetNamePredictions = () => {
            return ExtendableObject._streetNamePredictions;
        };

        ExtendableObject.setStreetNamePredictions = async (value) => {
            const resolvedValue = await ExtendableObject.util.Promise.resolve(value);

            if (ExtendableObject.streetNamePredictions !== resolvedValue) {
                ExtendableObject._streetNamePredictions = resolvedValue;
                ExtendableObject._streetNamePredictionsIndex = ExtendableObject._streetFullPredictionsIndexDefault;
            }
        };
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
                ExtendableObject._allowFetchStreetNameAutocomplete = false;
                ExtendableObject.streetName = subscriber.value;
                ExtendableObject._allowToNotifyStreetNameSubscribers = true;

                if (ExtendableObject.active) {
                    ExtendableObject.util.invalidateAddressMeta();
                }
            };
        };

        /**
         * Handler for street name changes via direct input (field in focus)
         * @param {Object} subscriber - The subscriber object that triggered the input
         * @returns {Function} Event handler that updates streetName while preventing circular updates
         */
        ExtendableObject.cb.streetNameInput = (subscriber) => {
            return () => {
                ExtendableObject._allowToNotifyStreetNameSubscribers = false;
                ExtendableObject._allowFetchStreetNameAutocomplete = true;
                ExtendableObject.streetName = subscriber.value;
                ExtendableObject._allowToNotifyStreetNameSubscribers = true;
                ExtendableObject._allowFetchStreetNameAutocomplete = false;

                if (ExtendableObject.active) {
                    ExtendableObject.util.invalidateAddressMeta();
                }
            };
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
                        ExtendableObject._streetNamePredictionsIndex = ExtendableObject._streetFullPredictionsIndexDefault;
                        ExtendableObject.util.removeStreetNamePredictionsDropdown();
                    }
                } catch (error) {
                    console.warn('Error in streetNameBlur handler:', error);
                }

                try {
                    await ExtendableObject.waitUntilReady();
                    await ExtendableObject.cb.handleFormBlur();
                } catch (error) {
                    console.warn('Error in buildingNumberBlur handler:', error);
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
        ExtendableObject.cb.streetNameKeydown = function () {
            return function (e) {
                if (e.key === 'ArrowUp' || e.key === 'Up') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (ExtendableObject._streetNamePredictionsIndex > -1) {
                        ExtendableObject._streetNamePredictionsIndex -= 1;
                    } else if (ExtendableObject._streetNamePredictionsIndex === -1) {
                        // Set index to the last item if ArrowUp is pressed after reaching nothing selected
                        ExtendableObject._streetNamePredictionsIndex = ExtendableObject._streetNamePredictions.length - 1;
                    }
                    ExtendableObject.util.renderStreetNamePredictionsDropdown(
                        ExtendableObject.streetNamePredictions
                    );
                } else if (e.key === 'ArrowDown' || e.key === 'Down') {
                    if (ExtendableObject._streetNamePredictionsIndex < (ExtendableObject._streetNamePredictions.length - 1)) {
                        ExtendableObject._streetNamePredictionsIndex += 1;
                    } else {
                        // Set index to -1 (nothing selected) if ArrowDown is pressed at the end of the list
                        ExtendableObject._streetNamePredictionsIndex = -1;
                    }
                    ExtendableObject.util.renderStreetNamePredictionsDropdown(
                        ExtendableObject.streetNamePredictions
                    );
                } else if ((e.key === 'Tab' && e.shiftKey)) {
                    if (ExtendableObject._streetNamePredictions.length > 0) {
                        if (ExtendableObject._streetNamePredictionsIndex >= 0) {
                            e.preventDefault();
                            e.stopPropagation();
                            ExtendableObject.cb.applyStreetNamePredictionSelection(
                                ExtendableObject._streetNamePredictionsIndex,
                                ExtendableObject._streetNamePredictions
                            );
                        }
                        ExtendableObject.streetNamePredictions = [];
                        ExtendableObject.util.removeStreetNamePredictionsDropdown();
                    }
                } else if (e.key === 'Tab') {
                    if (ExtendableObject._streetNamePredictions.length > 0) {
                        if (ExtendableObject._streetNamePredictionsIndex >= 0) {
                            e.preventDefault();
                            e.stopPropagation();
                            ExtendableObject.cb.applyStreetNamePredictionSelection(
                                ExtendableObject._streetNamePredictionsIndex,
                                ExtendableObject._streetNamePredictions
                            );
                        }
                        ExtendableObject.streetNamePredictions = [];
                        ExtendableObject.util.removeStreetNamePredictionsDropdown();
                    }
                } else if (e.key === 'Enter') {
                    if (ExtendableObject._streetNamePredictions.length > 0) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        ExtendableObject.cb.applyStreetNamePredictionSelection(
                            ExtendableObject._streetNamePredictionsIndex,
                            ExtendableObject._streetNamePredictions
                        );
                        ExtendableObject.streetNamePredictions = [];
                    }
                    ExtendableObject.util.removeStreetNamePredictionsDropdown();
                } else if (e.key === 'Backspace') {
                    ExtendableObject.config.ux.smartFill = false;
                } else if (e.key === 'Escape') {
                    ExtendableObject.util.removeStreetNamePredictionsDropdown();
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    e.stopPropagation();
                    ExtendableObject._streetNamePredictionsIndex = 0;
                    ExtendableObject.util.renderStreetNamePredictionsDropdown(
                        ExtendableObject.streetNamePredictions
                    );
                } else if (e.key === 'End') {
                    e.preventDefault();
                    e.stopPropagation();
                    ExtendableObject._streetNamePredictionsIndex = ExtendableObject._streetNamePredictions.length - 1;
                    ExtendableObject.util.renderStreetNamePredictionsDropdown(
                        ExtendableObject.streetNamePredictions
                    );
                }
            };
        };

        /**
         * Applies the selected prediction from the streetName predictions dropdown.
         *
         * This method updates the `streetName` field with the selected prediction
         * and optionally updates related fields such as `buildingNumber` and `additionalInfo`
         * if they are present in the selected prediction.
         *
         * @param {number} index - The index of the selected prediction in the predictions array.
         * @param {Array} predictions - An array of prediction objects containing streetName data.
         *
         * Each prediction object can have the following properties:
         * - streetName: {string} The name of the street.
         * - buildingNumber: {string} (Optional) The building number.
         * - additionalInfo: {string} (Optional) Additional address information.
         *
         * If the index is valid, the method updates the `streetName` field and any
         * related fields with the corresponding values from the selected prediction.
         */
        ExtendableObject.cb.applyStreetNamePredictionSelection = (index, predictions) => {
            if (index >= 0 && index < predictions.length) {
                const selectedPrediction = predictions[index];

                // Set the streetName value to the selected prediction
                ExtendableObject.streetName = selectedPrediction.streetName;

                // Optionally, update other related fields if necessary
                if (selectedPrediction.buildingNumber) {
                    ExtendableObject.buildingNumber = selectedPrediction.buildingNumber;
                }
                if (selectedPrediction.additionalInfo) {
                    ExtendableObject.additionalInfo = selectedPrediction.additionalInfo;
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
        ExtendableObject.util.displayStreetNameAutocompleteDropdown = (streetName) => {
            ExtendableObject.util.removeStreetNamePredictionsDropdown();

            if (ExtendableObject._streetNameAutocompleteTimeout) {
                clearTimeout(ExtendableObject._streetNameAutocompleteTimeout);
            }

            ExtendableObject._streetNameAutocompleteTimeout = setTimeout(async () => {
                ExtendableObject._streetNameAutocompleteTimeout = null;
                try {
                    const autocompleteResult = await ExtendableObject.util.getStreetNamePredictions(streetName);
                    const currentStreetName = ExtendableObject.getStreetName();

                    if (autocompleteResult.originalStreetName !== currentStreetName) {
                        return;
                    }
                    ExtendableObject.streetNamePredictions = autocompleteResult.predictions;
                    ExtendableObject.util.renderStreetNamePredictionsDropdown(autocompleteResult.predictions);
                } catch (e) {
                    console.warn('Failed fetching predictions', e, streetName);
                }
            }, ExtendableObject.config.ux.delay.inputAssistant);
        };

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
            ExtendableObject._subscribers.streetName.forEach((subscriber) => {
                if (document.querySelector('[endereco-street-name-predictions]')) {
                    ExtendableObject._openDropdowns--;
                    document.querySelector('[endereco-street-name-predictions]').parentNode.removeChild(document.querySelector('[endereco-street-name-predictions]'));
                }

                // Render predictions only if the field is active and there are predictions.
                if (
                    predictions.length > 0 &&
                    (document.activeElement === subscriber.object)
                ) {
                    let startingIndex = 0;
                    const preparedPredictions = [];

                    // Prepare predictions.
                    predictions.forEach(function (prediction) {
                        const diff = diffChars(ExtendableObject.streetName, prediction.streetName, { ignoreCase: true });
                        let streetNameHtml = '';

                        diff.forEach(function (part) {
                            const markClass = part.added
                                ? 'endereco-span--add'
                                : part.removed ? 'endereco-span--remove' : 'endereco-span--neutral';

                            streetNameHtml += `<span class="${markClass}">${part.value.replace(/[ ]/g, '&nbsp;')}</span>`;
                        });

                        preparedPredictions.push({
                            streetName: prediction.streetName,
                            streetNameDiff: streetNameHtml
                        });
                    });

                    // Prepare dropdown.
                    const predictionsHtml = ExtendableObject.util.Mustache.render(ExtendableObject.config.templates.streetNamePredictions, {
                        ExtendableObject,
                        predictions: preparedPredictions,
                        offsetTop: subscriber.object.offsetTop + subscriber.object.offsetHeight,
                        offsetLeft: subscriber.object.offsetLeft,
                        width: subscriber.object.offsetWidth,
                        direction: getComputedStyle(subscriber.object).direction,
                        longList: (preparedPredictions.length > MAX_PREDICTIONS_BEFORE_SCROLL),
                        index: function () {
                            return (startingIndex - 1); // TODO: add loop finishing function to increase counter.
                        },
                        isActive: function () {
                            const isActive = (startingIndex === ExtendableObject._streetNamePredictionsIndex);

                            startingIndex++;

                            return isActive;
                        }
                    });

                    // Helper function to scroll the active item into view
                    const scrollActiveItemIntoView = () => {
                        const dropdown = document.querySelector('[endereco-street-name-predictions]');
                        const activeItem = dropdown?.querySelector('.endereco-predictions__item.active');

                        if (dropdown && activeItem) {
                            const dropdownScrollContainer = dropdown.querySelector('.endereco-predictions');

                            if (!dropdownScrollContainer) return;

                            const containerRect = dropdownScrollContainer.getBoundingClientRect();
                            const activeRect = activeItem.getBoundingClientRect();

                            // Calculate relative positions
                            const itemTop = activeRect.top - containerRect.top + dropdownScrollContainer.scrollTop;
                            const itemBottom = activeRect.bottom - containerRect.top + dropdownScrollContainer.scrollTop;
                            const containerHeight = dropdownScrollContainer.clientHeight;
                            const currentScrollTop = dropdownScrollContainer.scrollTop;

                            // Check if the active item is above the visible area
                            if (itemTop < currentScrollTop) {
                                dropdownScrollContainer.scrollTop = itemTop;
                            } else if (itemBottom > currentScrollTop + containerHeight) {
                                // Check if the active item is below the visible area
                                dropdownScrollContainer.scrollTop = itemBottom - containerHeight;
                            }
                        }
                    };

                    // Attach it to HTML.
                    subscriber.object.insertAdjacentHTML('afterend', predictionsHtml);

                    // Scroll active item into view after DOM insertion
                    setTimeout(scrollActiveItemIntoView, 0);

                    ExtendableObject._openDropdowns++;
                    document.querySelectorAll(`[data-id="${ExtendableObject.id}"] [endereco-street-name-prediction]`).forEach(function (DOMElement) {
                        DOMElement.addEventListener('mousedown', function (e) {
                            const index = parseInt(this.getAttribute('data-prediction-index'));

                            e.preventDefault();
                            e.stopPropagation();
                            ExtendableObject._allowFetchStreetNameAutocomplete = false;
                            ExtendableObject.streetName = predictions[index].streetName;
                            ExtendableObject.streetNamePredictions = [];
                            ExtendableObject._allowFetchStreetNameAutocomplete = true;
                            ExtendableObject.util.removeStreetNamePredictionsDropdown();
                        });
                    });
                }
            });
        };

        /**
         * Removes the street name predictions dropdown from the DOM
         * Updates the dropdown counter and cleans up related state
         */

        ExtendableObject.util.removeStreetNamePredictionsDropdown = () => {
            ExtendableObject._subscribers.streetName.forEach(() => {
                const dropdown = document.querySelector('[endereco-street-name-predictions]');

                if (dropdown) {
                    dropdown.parentNode.removeChild(dropdown);
                }
            });

            // Reset the predictions index to clear the selection
            ExtendableObject._streetNamePredictionsIndex = ExtendableObject._streetFullPredictionsIndexDefault;
        };

        /**
         * Ensures street full is properly composed from name and number
         * Can operate in either synchronous (immediate await) or asynchronous (debounced) mode
         * @param {string} countryCode - Country code for formatting
         * @param {string} streetName - Street name component
         * @param {string} buildingNumber - Building number component
         * @returns {Promise<void|string>} - Returns void in async mode, composed street in sync mode
         */
        ExtendableObject.util.ensureStreetFullIntegrity = (countryCode, streetName, buildingNumber) => {
            // Based on internal flag, choose appropriate execution mode
            if (ExtendableObject._isIntegrityOperationSynchronous) {
                return ExtendableObject.util.ensureStreetFullIntegrityAsync(countryCode, streetName, buildingNumber);
            } else {
                ExtendableObject.util.ensureStreetFullIntegrityWithDebounce(countryCode, streetName, buildingNumber);
            }
        };

        /**
         * Ensures street full integrity with debouncing (original behavior)
         * @param {string} countryCode - Country code for formatting
         * @param {string} streetName - Street name component
         * @param {string} buildingNumber - Building number component
         */
        ExtendableObject.util.ensureStreetFullIntegrityWithDebounce = (countryCode, streetName, buildingNumber) => {
            if (ExtendableObject._streetFullComposeTimeout) {
                clearTimeout(ExtendableObject._streetFullComposeTimeout);
            }

            ExtendableObject._streetFullComposeTimeout = setTimeout(() => {
                try {
                    const streetFull = ExtendableObject.util.Mustache.render(
                        ExtendableObject.config.templates.streetFull.getTemplate(countryCode),
                        {
                            streetName,
                            buildingNumber
                        }
                    ).replace(/  +/g, ' ').replace(/(\r\n|\n|\r)/gm, '').trim();

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
                    console.warn('Street compose failed', e, countryCode, streetName, buildingNumber);
                }
                ExtendableObject._streetFullComposeTimeout = null;
            }, ExtendableObject.config.ux.delay.inputAssistant);
        };

        /**
         * Ensures street full integrity synchronously (immediate execution)
         * @param {string} countryCode - Country code for formatting
         * @param {string} streetName - Street name component
         * @param {string} buildingNumber - Building number component
         * @returns {Promise<string|null>} Composed street full or null if failed
         */
        ExtendableObject.util.ensureStreetFullIntegrityAsync = async function (countryCode, streetName, buildingNumber) {
            try {
                const streetFull = ExtendableObject.util.Mustache.render(
                    ExtendableObject.config.templates.streetFull.getTemplate(countryCode),
                    {
                        streetName,
                        buildingNumber
                    }
                ).replace(/  +/g, ' ').replace(/(\r\n|\n|\r)/gm, '').trim();

                // Check if result is outdated
                if ((ExtendableObject.streetName !== streetName) || (ExtendableObject.buildingNumber !== buildingNumber)) {
                    return null;
                }

                ExtendableObject._allowStreetFullSplit = false;
                ExtendableObject._allowFetchStreetFullAutocomplete = false;
                await ExtendableObject.setStreetFull(streetFull);
                ExtendableObject._allowStreetFullSplit = true;
                ExtendableObject._allowFetchStreetFullAutocomplete = true;

                return streetFull;
            } catch (e) {
                console.warn('Synchronous street compose failed', e, countryCode, streetName, buildingNumber);

                return null;
            }
        };
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
            if (typeof streetNameRaw !== 'string') {
                throw new Error('Invalid argument. The streetNameRaw has to be a string');
            }

            const streetName = streetNameRaw.trim();
            const autocompleteResult = {
                originalStreetName: streetName,
                predictions: []
            };

            // Early return
            if (streetName === '') {
                return autocompleteResult;
            }

            const cacheKey = [
                ExtendableObject.countryCode,
                ExtendableObject.config.lang,
                ExtendableObject.postalCode,
                ExtendableObject.locality,
                streetName,
                ExtendableObject.buildingNumber
            ].join('-');

            if (!ExtendableObject.streetNameAutocompleteCache.cachedResults[cacheKey]) {
                const autocompleteRequestIndex = ++ExtendableObject._streetNameAutocompleteRequestIndex;

                const message = {
                    jsonrpc: '2.0',
                    id: autocompleteRequestIndex,
                    method: 'streetAutocomplete',
                    params: {
                        country: ExtendableObject.countryCode,
                        language: ExtendableObject.config.lang,
                        postCode: ExtendableObject.postalCode,
                        cityName: ExtendableObject.locality,
                        street: streetName,
                        houseNumber: ExtendableObject.buildingNumber
                    }
                };

                const headers = {
                    'X-Auth-Key': ExtendableObject.config.apiKey,
                    'X-Agent': ExtendableObject.config.agentName,
                    'X-Remote-Api-Url': ExtendableObject.config.remoteApiUrl,
                    'X-Transaction-Referer': window.location.href,
                    'X-Transaction-Id': ExtendableObject.hasLoadedExtension?.('SessionExtension')
                        ? ExtendableObject.sessionId
                        : 'not_required'
                };

                const streetNamePredictionsTemp = [];

                const EnderecoAPI = ExtendableObject.getEnderecoAPI();

                if (!EnderecoAPI) {
                    console.warn('EnderecoAPI is not available');

                    return autocompleteResult;
                }

                const result = await EnderecoAPI.sendRequestToAPI(message, headers);

                if (result?.data?.error?.code === ERROR_EXPIRED_SESSION) {
                    ExtendableObject.util.updateSessionId?.();
                }

                if (!result || !result.data || !result.data.result) {
                    console.warn("API didn't return a valid result");

                    return autocompleteResult;
                }

                // If session counter is set, increase it.
                if (ExtendableObject.hasLoadedExtension('SessionExtension')) {
                    ExtendableObject.sessionCounter++;
                }

                result.data.result.predictions.forEach((streetNamePrediction) => {
                    if (!streetNamePrediction) return;

                    const { country, street, buildingNumber, additionalInfo } = streetNamePrediction || {};

                    const tempStreetNameContainer = {
                        countryCode: country ?? ExtendableObject._countryCode,
                        streetName: street ?? '',
                        buildingNumber: buildingNumber ?? '',
                        additionalInfo: additionalInfo ?? ''
                    };

                    if (streetNamePrediction.streetFull === undefined) {
                        tempStreetNameContainer.streetFull = ExtendableObject.util.Mustache.render(
                            streetFullTemplateFactory.getTemplate(tempStreetNameContainer.countryCode),
                            {
                                streetName: tempStreetNameContainer.streetName,
                                buildingNumber: tempStreetNameContainer.buildingNumber,
                                additionalInfo: tempStreetNameContainer.additionalInfo
                            }
                        )
                            .replace(/(\r\n|\n|\r)/gm, '')
                            .trim();
                    }

                    streetNamePredictionsTemp.push(tempStreetNameContainer);
                });

                ExtendableObject.streetNameAutocompleteCache.cachedResults[cacheKey] = streetNamePredictionsTemp;
            }

            autocompleteResult.predictions = ExtendableObject.streetNameAutocompleteCache.cachedResults[cacheKey];

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
         * @returns {string} Processed street name value
         */
        ExtendableObject.cb.setStreetName = (streetName) => streetName;
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
};

export default StreetNameExtension;

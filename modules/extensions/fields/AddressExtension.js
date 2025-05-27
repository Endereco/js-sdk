import addressFullTemplates from '../../../templates/addressFullTemplates';
import addressPredictionsPopupWrapper from '../../../templates/address_check_wrapper_template.html';
import addressNotFoundPopupWrapper from '../../../templates/address_not_found_wrapper_template.html';
import addressNoPredictionWrapper from '../../../templates/address_no_prediction_wrapper_template.html';
import { diffWords } from 'diff';
import EnderecoSubscriber from '../../subscriber';

const WAIT_FOR_TIME = 100;
const ERROR_EXPIRED_SESSION = -32700;
const MILLISECONDS_IN_SECOND = 1000;

/**
 * Pauses execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to sleep.
 * @returns {Promise<void>} - A promise that resolves after the specified delay.
 */
const sleep = (ms) => {
    return new Promise(resolve => {
        const timer = setTimeout(() => {
            clearTimeout(timer);
            resolve();
        }, ms);
    });
};

/**
 * Executes callbacks before persisting address check results
 * @param {Object} ExtendableObject - The address object instance
 * @param {Object} finalResult - The result data that will be persisted
 * @returns {Promise} - Resolves when all callbacks have completed
 */
const onBeforeResultPersisted = async (ExtendableObject, finalResult) => {
    try {
        // Initialize callback collection if not exists
        if (!Array.isArray(ExtendableObject.onBeforeAddressPersisted)) {
            ExtendableObject.onBeforeAddressPersisted = [];
        }

        // Collect all promises returned from callbacks
        const promises = ExtendableObject.onBeforeAddressPersisted.map(cb => {
            const result = cb(ExtendableObject, finalResult);

            // Check if the result is a promise
            return result instanceof Promise ? result : Promise.resolve(result);
        });

        // Wait for all promises to resolve
        await Promise.all(promises);
    } catch (err) {
        console.warn('Error in onBeforeResultPersisted callbacks:', {
            error: err
        });
    }
};

/**
 * Executes callbacks after persisting address check results
 * @param {Object} ExtendableObject - The address object instance
 * @param {Object} finalResult - The result data that was persisted
 * @returns {Promise} - Resolves when all callbacks have completed
 */
const onAfterResultPersisted = async (ExtendableObject, finalResult) => {
    try {
        // Initialize callback collection if not exists
        if (!Array.isArray(ExtendableObject.onAfterAddressPersisted)) {
            ExtendableObject.onAfterAddressPersisted = [];
        }

        // Collect all promises returned from callbacks
        const promises = ExtendableObject.onAfterAddressPersisted.map(cb => {
            const result = cb(ExtendableObject, finalResult);

            // Check if the result is a promise
            return result instanceof Promise ? result : Promise.resolve(result);
        });

        // Wait for all promises to resolve
        await Promise.all(promises);
    } catch (err) {
        console.warn('Error in onAfterResultPersisted callbacks:', {
            error: err
        });
    }
};

/**
 * Waits until the specified key becomes the first in the queue
 * @param {string} key - The key to wait for
 * @param {number} checkInterval - Interval in ms to check the queue (default: 100ms)
 * @returns {Promise} - Resolves when the key is first, rejects if key is removed or on timeout
 */
const waitForTurn = (key, checkInterval = WAIT_FOR_TIME) => {
    return new Promise((resolve, reject) => {
        if (isFirstInQueue(key)) {
            resolve();

            return;
        }
        const intervalId = setInterval(() => {
            if (isFirstInQueue(key)) {
                clearInterval(intervalId);
                resolve();
            }
        }, checkInterval);
    });
};

/**
 * Check if a key is the first in the queue
 * @param {string} key - The key to check
 * @returns {boolean} - True if the key is first in the queue
 */
const isFirstInQueue = (key) => {
    const integrator = window.EnderecoIntegrator;

    if (integrator.processQueue.size === 0) return false;

    // Get the first key in the queue
    const firstKey = integrator.processQueue.keys().next().value;

    return key === firstKey;
};

/**
 * Generates a cache key for an address object.
 * @param {Object} address - The address object.
 * @returns {string} - The generated cache key.
 */
const generateAddressCacheKey = (address) => {
    const fields = [
        'countryCode',
        'subdivisionCode',
        'postalCode',
        'locality',
        'streetFull',
        'streetName',
        'buildingNumber',
        'additionalInfo'
    ];

    const values = fields.map(field =>
        Object.prototype.hasOwnProperty.call(address, field) ? String(address[field]).trim() : '-'
    );

    return values.join('|');
};

/**
 * Attaches event handlers for closing the modal.
 * @param {Object} ExtendableObject - The address object instance.
 * @param {HTMLElement} modalElement - The modal element.
 * @param {Function} onClose - The callback function to execute when the modal is closed.
 */
const attachModalCloseHandlers = (ExtendableObject, modalElement, onClose) => {
    modalElement.querySelectorAll('[endereco-modal-close]').forEach(element => {
        element.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            try {
                // Collect all promises returned from callbacks
                const promises = ExtendableObject.onCloseModal.map(cb => {
                    const result = cb(ExtendableObject);

                    // Check if the result is a promise
                    return result instanceof Promise ? result : Promise.resolve(result);
                });

                // Wait for all promises to resolve
                await Promise.all(promises);
            } catch (err) {
                console.warn('Error in modal close action custom callbacks:', {
                    error: err
                });
            }

            try {
                onClose();
            } catch (err) {
                console.warn('Error in model close handler handler:', {
                    error: err,
                    dataObject: ExtendableObject
                });
            }

            ExtendableObject.util.removePopup();
        });
    });
};

/**
 * Attaches event handlers for editing the address.
 * @param {Object} ExtendableObject - The address object instance.
 * @param {HTMLElement} modalElement - The modal element.
 * @param {Function} onEdit - The callback function to execute when the address is edited.
 */
const attachEditAddressHandlers = (ExtendableObject, modalElement, onEdit) => {
    modalElement.querySelectorAll('[endereco-edit-address]').forEach(element => {
        element.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Disable the element to prevent double-clicking
            element.disabled = true;

            try {
                // Collect all promises returned from callbacks
                const promises = ExtendableObject.onEditAddress.map(cb => {
                    const result = cb(ExtendableObject);

                    // Check if the result is a promise
                    return result instanceof Promise ? result : Promise.resolve(result);
                });

                // Wait for all promises to resolve
                await Promise.all(promises);
            } catch (err) {
                console.warn('Error in model edit action custom callbacks:', {
                    error: err
                });
            }

            try {
                onEdit();
            } catch (err) {
                console.warn('Error in model edit action handler:', {
                    error: err,
                    dataObject: ExtendableObject
                });
            }

            // Re-enable the element if there's an error in the second try-catch block
            element.disabled = false;
            // Only remove popup after all callbacks have completed
            ExtendableObject.util.removePopup();
        });
    });
};

/**
 * Attaches event handlers for selecting an address prediction.
 * @param {Object} ExtendableObject - The address object instance.
 * @param {HTMLElement} modalElement - The modal element.
 * @param {Function} onSelect - The callback function to execute when an address prediction is selected.
 */
const attachSelectionHandlers = (ExtendableObject, modalElement, onSelect) => {
    modalElement.querySelectorAll('[endereco-use-selection]').forEach(element => {
        element.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Disable the element to prevent double-clicking
            element.disabled = true;

            try {
                // Collect all promises returned from callbacks
                const promises = ExtendableObject.onAfterAddressCheckSelected.map(cb => {
                    const result = cb(ExtendableObject);

                    // Check if the result is a promise
                    return result instanceof Promise ? result : Promise.resolve(result);
                });

                // Wait for all promises to resolve
                await Promise.all(promises);
            } catch (err) {
                console.warn('Error in model select action custom callbacks:', {
                    error: err
                });
            }

            try {
                onSelect(
                    parseInt(modalElement.querySelector("[name='endereco-address-predictions']:checked").value)
                );
            } catch (err) {
                console.warn('Error in modal select correction handler:', {
                    error: err,
                    dataObject: ExtendableObject
                });
            }

            // Re-enable the element if there's an error in the second try-catch block
            element.disabled = false;
            ExtendableObject.util.removePopup();
        });
    });
};

/**
 * Attaches event handlers for radio inputs of address predictions.
 * @param {Object} ExtendableObject - The address object instance.
 * @param {HTMLElement} modalElement - The modal element.
 */
const attachPredictionsRadioHandlers = (ExtendableObject, modalElement) => {
    const predictionInputs = modalElement.querySelectorAll('[name="endereco-address-predictions"]');

    // Add subscribers for value syncing
    predictionInputs.forEach(input => {
        ExtendableObject.addSubscriber(
            new EnderecoSubscriber(
                'addressPredictionsIndex',
                input,
                { syncValue: true }
            )
        );
    });

    // Add change event handlers
    predictionInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const modal = e.target.closest('.endereco-modal');
            const selectedValue = parseInt(e.target.value);

            // Handle origin display toggle
            const originElements = modal.querySelectorAll('[endereco-show-if-origin]');

            originElements.forEach(element => {
                element.style.display = selectedValue >= 0 ? 'none' : 'block';
            });

            const confirmCheckbox = modalElement.querySelector('[endereco-confirm-address-checkbox]');

            if (confirmCheckbox) {
                const isChecked = confirmCheckbox.checked;

                modal.querySelectorAll('[endereco-disabled-until-confirmed]').forEach(element => {
                    element.disabled = !(isChecked || (selectedValue >= 0));
                });
            }
        });

        // Apply initial states
        const modal = input.closest('.endereco-modal');
        const currentValue = ExtendableObject.addressPredictionsIndex;

        // Set initial origin visibility
        modal.querySelectorAll('[endereco-show-if-origin]').forEach(element => {
            element.style.display = currentValue >= 0 ? 'none' : 'block';
        });
    });
};

/**
 * Attaches event handlers for confirming the address.
 * @param {Object} ExtendableObject - The address object instance.
 * @param {HTMLElement} modalElement - The modal element.
 * @param {Function} onConfirm - The callback function to execute when the address is confirmed.
 */
const attachConfirmAddressHandlers = (ExtendableObject, modalElement, onConfirm) => {
    modalElement.querySelectorAll('[endereco-confirm-address]').forEach(element => {
        element.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Disable the element to prevent double-clicking
            element.disabled = true;

            try {
                // Collect all promises returned from callbacks
                const promises = ExtendableObject.onConfirmAddress.map(cb => {
                    const result = cb(ExtendableObject);

                    // Check if the result is a promise
                    return result instanceof Promise ? result : Promise.resolve(result);
                });

                // Wait for all promises to resolve
                await Promise.all(promises);
            } catch (err) {
                console.warn('Error in model confirm action custom callbacks:', {
                    error: err
                });
            }

            try {
                await onConfirm();
            } catch (err) {
                console.warn('Error in modal confirm address handler:', {
                    error: err,
                    dataObject: ExtendableObject
                });
            }

            // Re-enable the element if there's an error in the second try-catch block
            element.disabled = false;
            ExtendableObject.util.removePopup();
        });
    });
};

/**
 * Attaches event handlers for the confirmation checkbox.
 * @param {Object} ExtendableObject - The address object instance.
 * @param {HTMLElement} modalElement - The modal element.
 */
const attachConfirmationCheckboxHandlers = (ExtendableObject, modalElement) => {
    if (!ExtendableObject.config.ux.confirmWithCheckbox) {
        return;
    }

    modalElement.querySelectorAll('[endereco-confirm-address-checkbox]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isChecked = e.target.checked;
            const predictionsAmount = e.target.closest('.endereco-modal').querySelectorAll('[name="endereco-address-predictions"]').length;

            e.target.closest('.endereco-modal').querySelectorAll('[endereco-disabled-until-confirmed]').forEach(element => {
                if (predictionsAmount > 0) {
                    element.disabled = !(isChecked || (ExtendableObject.addressPredictionsIndex >= 0));
                } else {
                    element.disabled = !isChecked;
                }
            });
        });

        // Apply initial state
        const isChecked = checkbox.checked;
        const predictionsAmount = checkbox.closest('.endereco-modal').querySelectorAll('[name="endereco-address-predictions"]').length;

        checkbox.closest('.endereco-modal').querySelectorAll('[endereco-disabled-until-confirmed]').forEach(element => {
            if (predictionsAmount > 0) {
                element.disabled = !(isChecked || (ExtendableObject.addressPredictionsIndex >= 0));
            } else {
                element.disabled = !isChecked;
            }
        });
    });
};

/**
 * Generates address validation errors based on status codes.
 * @param {Object} ExtendableObject - The address object instance.
 * @param {string[]} statuscodes - An array of status codes.
 * @returns {Object} - An object containing field errors and invalid fields.
 */
const generateAddressValidationErrors = (ExtendableObject, statuscodes) => {
    const result = {
        fieldErrors: [],
        invalidFields: new Set()
    };

    // Helper to get text from config or fallback
    const getStatusText = (code, fallback) => {
        return window.EnderecoIntegrator.config.texts.errorMessages?.[code] || fallback;
    };
    const isNormalAddress = ['general_address', 'billing_address', 'shipping_address'].includes(ExtendableObject.addressType) &&
        !statuscodes.includes('address_is_packstation') && !statuscodes.includes('address_is_postoffice');

    const isPackstation = ['packstation'].includes(ExtendableObject.addressType) ||
        statuscodes.includes('address_is_packstation');

    const isPostoffice = ['postoffice'].includes(ExtendableObject.addressType) ||
        statuscodes.includes('address_is_postoffice');

    const fieldErrorRules = [
        {
            validate: (ExtendableObject, statuscodes) => {
                return isNormalAddress &&
                    !statuscodes.includes('street_full_not_found') &&
                    statuscodes.includes('building_number_is_missing');
            },
            fieldClass: 'endereco-invalid-building-number',
            messageId: 'address_has_missing_building_number_content',
            defaultMessage: 'Die Hausnummer fehlt in der Eingabe.'
        },
        {
            validate: (ExtendableObject, statuscodes) => {
                return isNormalAddress &&
                    statuscodes.includes('street_full_not_found') &&
                    statuscodes.includes('building_number_is_missing');
            },
            fieldClass: 'endereco-invalid-street-full',
            messageId: 'address_has_missing_building_number_content',
            defaultMessage: 'Die Hausnummer fehlt in der Eingabe.'
        },
        {
            validate: (ExtendableObject, statuscodes) => {
                return isNormalAddress &&
                    statuscodes.includes('street_full_not_found') &&
                    statuscodes.includes('building_number_not_found') &&
                    !statuscodes.includes('building_number_is_missing');
            },
            fieldClass: 'endereco-invalid-street-full',
            messageId: 'address_has_unresolvable_building_number_content',
            defaultMessage: 'Mit der eingegebenen Hausnummer konnte die Adresse nicht verifiziert werden.'
        },
        {
            validate: (ExtendableObject, statuscodes) => {
                return isNormalAddress &&
                    !statuscodes.includes('street_full_not_found') &&
                    statuscodes.includes('building_number_not_found') &&
                    !statuscodes.includes('building_number_is_missing');
            },
            fieldClass: 'endereco-invalid-building-number',
            messageId: 'address_has_unresolvable_building_number_content',
            defaultMessage: 'Mit der eingegebenen Hausnummer konnte die Adresse nicht verifiziert werden.'
        },
        {
            validate: (ExtendableObject, statuscodes) => {
                return isPackstation && statuscodes.includes('address_not_found') &&
                    !(statuscodes.includes('additional_info_needs_correction') ||
                        statuscodes.includes('additional_info_not_found')
                    );
            },
            fieldClass: 'endereco-invalid-packstation-address',
            messageId: 'packstation_has_unresolvable_address',
            defaultMessage: 'Die Packstation-Adresse konnte nicht gefunden werden.'
        },
        {
            validate: (ExtendableObject, statuscodes) => {
                return isPostoffice && statuscodes.includes('address_not_found') &&
                    !(statuscodes.includes('additional_info_needs_correction') ||
                        statuscodes.includes('additional_info_not_found')
                    );
            },
            fieldClass: 'endereco-invalid-packstation-address',
            messageId: 'postoffice_has_unresolvable_address',
            defaultMessage: 'Die Postfilialen-Adresse konnte nicht gefunden werden.'
        },
        {
            validate: (ExtendableObject, statuscodes) => {
                return (isPackstation || isPostoffice) &&
                    !statuscodes.includes('additional_info_is_missing') &&
                    (statuscodes.includes('additional_info_needs_correction') ||
                        statuscodes.includes('additional_info_not_found'));
            },
            fieldClass: 'endereco-invalid-postnummer',
            messageId: 'packstation_has_unresolvable_postnummer',
            defaultMessage: 'Die Postnummer ist ungültig.'
        },
        {
            validate: (ExtendableObject, statuscodes) => {
                return (isPackstation || isPostoffice) &&
                    statuscodes.includes('additional_info_is_missing');
            },
            fieldClass: 'endereco-invalid-postnummer',
            messageId: 'packstation_has_missing_postnummer',
            defaultMessage: 'Die Postnummer fehlt in der Eingabe.'
        }
    ];

    fieldErrorRules.forEach(rule => {
        if (rule.validate(ExtendableObject, statuscodes)) {
            const errorMessage = getStatusText(rule.messageId, rule.defaultMessage);

            result.fieldErrors.push(errorMessage);
            result.invalidFields.add(rule.fieldClass);
        }
    });

    result.invalidFields = Array.from(result.invalidFields);

    return result;
};

/**
 * Checks if the address correction was automatic.
 * @param {string[]} statuscodes - An array of status codes.
 * @returns {boolean} - True if the correction was automatic, false otherwise.
 */
const isAutomaticCorrection = (statuscodes) => {
    return statuscodes.includes('address_correct') || statuscodes.includes('address_minor_correction');
};

/**
 * Checks if the address is correct.
 * @param {string[]} statuscodes - An array of status codes.
 * @returns {boolean} - True if the address is correct, false otherwise.
 */
const isAddressCorrect = (statuscodes) => {
    return statuscodes.includes('address_correct');
};

/**
 * Checks if prediction or meta feedback is needed.
 * @param {string[]} statuscodes - An array of status codes.
 * @param {Array} predictions - An array of address predictions.
 * @returns {boolean} - True if prediction or meta feedback is needed, false otherwise.
 */
const isPredictionOrMetaFeedbackNeeded = (statuscodes, predictions) => {
    // Case when there are multiple predictions
    return predictions.length > 0 &&
        (statuscodes.includes('address_multiple_variants') || statuscodes.includes('address_needs_correction'));
};

/**
 * Checks if only meta feedback is needed.
 * @param {string[]} statuscodes - An array of status codes.
 * @param {Array} predictions - An array of address predictions.
 * @returns {boolean} - True if only meta feedback is needed, false otherwise.
 */
const isOnlyMetaFeedbackNeeded = (statuscodes, predictions) => {
    return statuscodes.includes('address_not_found') || predictions.length === 0;
};

const AddressExtension = {
    name: 'AddressExtension',

    /**
     * Registers properties for the AddressExtension.
     * @param {Object} ExtendableObject - The object to extend.
     */
    registerProperties: (ExtendableObject) => {
        // Internal storage for field values
        ExtendableObject._addressStatus = [];
        ExtendableObject._addressPredictions = [];
        ExtendableObject._addressTimestamp = [];
        ExtendableObject._addressType = 'general_address';
        ExtendableObject._intent = 'edit';

        // Subscriber storage
        ExtendableObject._subscribers.address = [];
        ExtendableObject._subscribers.addressStatus = [];
        ExtendableObject._subscribers.addressPredictions = [];
        ExtendableObject._subscribers.addressPredictionsIndex = [];
        ExtendableObject._subscribers.addressTimestamp = [];
        ExtendableObject._subscribers.addressType = [];

        // Cache
        ExtendableObject._checkedAddress = {};
        ExtendableObject.addressCheckCache = {
            cachedResults: {}
        };

        // Flags
        ExtendableObject._addressIsBeingChecked = false;
        ExtendableObject._isIntegrityOperationSynchronous = false;

        // Timeout and sequence
        ExtendableObject._addressCheckRequestIndex = 0;
        ExtendableObject._addressCheckRoutineCounter = 0;
        ExtendableObject._addressPredictionsIndex = 0;
        ExtendableObject._openDropdowns = 0;
        ExtendableObject.onBlurTimeout = null;
        ExtendableObject._addressCheckQueue = {};
        ExtendableObject._addressCheckPromise = null;

        // Callback collectors.
        ExtendableObject.onAfterAddressCheckNoAction = [];
        ExtendableObject.onAfterAddressCheck = [];
        ExtendableObject.onAfterAddressCheckSelected = [];
        ExtendableObject.onAfterModalRendered = [];
        ExtendableObject.onBeforeAddressPersisted = [];
        ExtendableObject.onAfterAddressPersisted = [];
        ExtendableObject.onEditAddress = [];
        ExtendableObject.onConfirmAddress = [];
    },

    /**
     * Registers fields and their getters/setters for the AddressExtension.
     * @param {Object} ExtendableObject - The object to extend.
     */
    registerFields: (ExtendableObject) => {
        /**
         * Gets the current intent.
         * @returns {string} - The current intent.
         */
        ExtendableObject.getIntent = () => {
            return ExtendableObject._intent;
        };

        /**
         * Sets the current intent.
         * @param {string} intent - The intent to set.
         */
        ExtendableObject.setIntent = (intent) => {
            ExtendableObject._intent = intent;
        };

        // Add getter and setter for fields.
        Object.defineProperty(ExtendableObject, 'address', {
            get: () => {
                return ExtendableObject.getAddress();
            },
            set: (value) => {
                // eslint-disable-next-line no-unused-vars
                const _ = ExtendableObject.setAddress(value);
            }
        });

        /**
         * Gets the current address object.
         * @returns {Object} - The current address object.
         */
        ExtendableObject.getAddress = () => {
            const address = {};

            ExtendableObject.fieldNames.forEach(fieldName => {
                address[fieldName] = ExtendableObject[fieldName];
            });

            const optionalFields = [
                'subdivisionCode',
                'streetFull',
                'streetName',
                'buildingNumber',
                'additionalInfo'
            ];

            optionalFields.forEach(fieldName => {
                if (!ExtendableObject.util.hasSubscribedField(fieldName) &&
                    Object.prototype.hasOwnProperty.call(address, fieldName)
                ) {
                    delete address[fieldName];
                }
            });

            const hasStreetName = ExtendableObject.util.hasSubscribedField('streetName');
            const hasStreetFull = ExtendableObject.util.hasSubscribedField('streetFull');

            // If both fields exist in the formular, then we fall back to config to find out which is primary
            if (hasStreetName && hasStreetFull) {
                if (ExtendableObject.config.splitStreet) {
                    delete address.streetFull;
                } else {
                    delete address.streetName;
                    delete address.buildingNumber;
                }
            }

            return address;
        };

        /**
         * Sets the current address object.
         * @param {Object} address - The address object to set.
         * @returns {Promise<void>} - A promise that resolves when the address is set.
         */
        ExtendableObject.setAddress = async (address) => {
            try {
                const resolvedValue = await ExtendableObject.util.Promise.resolve(address);
                const addressValue = await ExtendableObject.cb.setAddress(resolvedValue);

                const setterPromises = ExtendableObject.fieldNames.map(fieldName => {
                    if (Object.prototype.hasOwnProperty.call(resolvedValue, fieldName)) {
                        // Dynamically calculate the setter name (e.g., "streetName" -> "setStreetName")
                        const setterName = `set${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`;

                        if (typeof ExtendableObject[setterName] === 'function') {
                            return ExtendableObject[setterName](addressValue[fieldName]);
                        }
                    }

                    return Promise.resolve();
                });

                // Wait for all setter promises to complete
                await Promise.all(setterPromises);
            } catch (err) {
                console.warn('Error setting address fields', {
                    error: err,
                    valueToSet: address
                });
                throw err;
            }
        };

        // Add the "addressStatus" property
        Object.defineProperty(ExtendableObject, 'addressStatus', {
            get: () => {
                return ExtendableObject.getAddressStatus();
            },
            set: (value) => {
                // eslint-disable-next-line no-unused-vars
                const _ = ExtendableObject.setAddressStatus(value);
            }
        });

        /**
         * Gets the current address status.
         * @returns {string[]} - The current address status.
         */
        ExtendableObject.getAddressStatus = () => {
            return Array.isArray(ExtendableObject._addressStatus)
                ? ExtendableObject._addressStatus
                : [];
        };

        /**
         * Sets the current address status.
         * @param {string[]|string} value - The address status to set.
         * @returns {Promise<void>} - A promise that resolves when the address status is set.
         */
        ExtendableObject.setAddressStatus = async (value) => {
            try {
                const resolvedValue = await ExtendableObject.util.Promise.resolve(value);

                // Decode. The value can come from DOM element as string.
                let decodedValue;

                if (typeof resolvedValue === 'string') {
                    // Split comma-separated string into array, trim whitespace
                    decodedValue = resolvedValue.split(',').map(item => item.trim());
                } else if (Array.isArray(resolvedValue)) {
                    decodedValue = resolvedValue;
                } else {
                    decodedValue = []; // Default for other types
                }

                // Fix for outdated status codes. They should not be processed or even used.
                const removeOutdatedValues = (array) => {
                    return array.filter(item =>
                        item !== 'not-checked' && item !== 'address_not_checked'
                    );
                };

                decodedValue = removeOutdatedValues(decodedValue);

                ExtendableObject._addressStatus = decodedValue;

                // Inform all subscribers about the change.
                const notificationProcesses = [];

                ExtendableObject._subscribers.addressStatus.forEach((subscriber) => {
                    try {
                        notificationProcesses.push(
                            subscriber.updateDOMValue(
                                Array.isArray(decodedValue)
                                    ? decodedValue.join(',')
                                    : String(decodedValue)
                            )
                        );
                    } catch (subErr) {
                        console.warn('Failed to update addressStatus subscriber:', {
                            error: subErr,
                            value: decodedValue
                        });
                    }
                });
                await Promise.all(notificationProcesses);
            } catch (err) {
                ExtendableObject._addressStatus = ExtendableObject._addressStatus || [];
                console.warn('Failed to set address status', {
                    error: err,
                    value
                });
            }
        };

        Object.defineProperty(ExtendableObject, 'addressPredictions', {
            get: () => {
                return ExtendableObject.getAddressPredictions();
            },
            set: (value) => {
                // eslint-disable-next-line no-unused-vars
                const _ = ExtendableObject.setAddressPredictions(value);
            }
        });

        /**
         * Gets the current address predictions.
         * @returns {Array} - The current address predictions.
         */
        ExtendableObject.getAddressPredictions = () => {
            return Array.isArray(ExtendableObject._addressPredictions)
                ? ExtendableObject._addressPredictions
                : [];
        };

        /**
         * Sets the current address predictions.
         * @param {Array|string} value - The address predictions to set.
         * @returns {Promise<void>} - A promise that resolves when the address predictions are set.
         */
        ExtendableObject.setAddressPredictions = async (value) => {
            try {
                const resolvedValue = await ExtendableObject.util.Promise.resolve(value);

                // Decode. The value can come from DOM element as string.
                const decodedValue = (typeof resolvedValue === 'string')
                    ? JSON.parse(resolvedValue) || []
                    : Array.isArray(resolvedValue) ? resolvedValue : [];

                ExtendableObject._addressPredictions = decodedValue;

                // Inform all subscribers about the change.
                const notificationProcesses = [];

                ExtendableObject._subscribers.addressPredictions.forEach((subscriber) => {
                    try {
                        notificationProcesses.push(subscriber.updateDOMValue(JSON.stringify(decodedValue)));
                    } catch (subErr) {
                        console.warn('Failed to update addressPredictions subscriber:', {
                            error: subErr,
                            value: decodedValue
                        });
                    }
                });
                await Promise.all(notificationProcesses);
            } catch (err) {
                console.warn('Error setting addressPredictions:', {
                    error: err,
                    inputValue: value,
                    timestamp: new Date()
                });
                ExtendableObject._addressPredictions = ExtendableObject._addressPredictions || [];
            }
        };

        Object.defineProperty(ExtendableObject, 'addressType', {
            get: () => {
                return ExtendableObject.getAddressType();
            },
            set: (value) => {
                // eslint-disable-next-line no-unused-vars
                const _ = ExtendableObject.setAddressType(value);
            }
        });

        /**
         * Gets the current address type.
         * @returns {string} - The current address type.
         */
        ExtendableObject.getAddressType = () => {
            return ExtendableObject._addressType;
        };

        /**
         * Sets the current address type.
         * @param {string} value - The address type to set.
         * @returns {Promise<void>} - A promise that resolves when the address type is set.
         */
        ExtendableObject.setAddressType = async (value) => {
            try {
                const resolvedValue = await Promise.resolve(value);

                ExtendableObject._addressType = resolvedValue;

                // Inform all subscribers about the change.
                const notificationProcesses = [];

                ExtendableObject._subscribers.addressType.forEach((subscriber) => {
                    try {
                        notificationProcesses.push(
                            subscriber.updateDOMValue(resolvedValue)
                        );
                    } catch (subErr) {
                        console.warn('Failed to update addressType subscriber:', {
                            error: subErr,
                            value: resolvedValue
                        });
                    }
                });
                await Promise.all(notificationProcesses);
            } catch (err) {
                console.warn('Failed to update addressType:', {
                    error: err,
                    value
                });
            }
        };

        // Add getter and setter for fields.
        Object.defineProperty(ExtendableObject, 'addressTimestamp', {
            get: () => {
                return ExtendableObject.getAddressTimestamp();
            },
            set: (value) => {
                // eslint-disable-next-line no-unused-vars
                const _ = ExtendableObject.setAddressTimestamp(value);
            }
        });

        /**
         * Gets the current address timestamp.
         * @returns {number} - The current address timestamp.
         */
        ExtendableObject.getAddressTimestamp = () => {
            return ExtendableObject._addressTimestamp;
        };

        /**
         * Sets the current address timestamp.
         * @param {number} value - The address timestamp to set.
         * @returns {Promise<void>} - A promise that resolves when the address timestamp is set.
         */
        ExtendableObject.setAddressTimestamp = async (value) => {
            try {
                const resolvedValue = await Promise.resolve(value);

                ExtendableObject._addressTimestamp = resolvedValue;

                // Inform all subscribers about the change.
                const notificationProcesses = [];

                ExtendableObject._subscribers.addressTimestamp.forEach((subscriber) => {
                    try {
                        notificationProcesses.push(
                            subscriber.updateDOMValue(resolvedValue)
                        );
                    } catch (subErr) {
                        console.warn('Failed to update addressTimestamp subscriber:', {
                            error: subErr,
                            value: resolvedValue
                        });
                    }
                });
                await Promise.all(notificationProcesses);
            } catch (err) {
                console.warn('Failed to update addressTimestamp:', {
                    error: err,
                    value
                });
            }
        };

        // Add getter and setter for fields.
        Object.defineProperty(ExtendableObject, 'addressPredictionsIndex', {
            get: () => {
                return ExtendableObject.getAddressPredictionsIndex();
            },
            set: (value) => {
                // eslint-disable-next-line no-unused-vars
                const _ = ExtendableObject.setAddressPredictionsIndex(value);
            }
        });

        /**
         * Gets the current address predictions index.
         * @returns {number} - The current address predictions index.
         */
        ExtendableObject.getAddressPredictionsIndex = () => {
            return ExtendableObject._addressPredictionsIndex;
        };

        /**
         * Sets the current address predictions index.
         * @param {number|string} value - The address predictions index to set. Can be a number or a string that can be parsed as a number.
         * @returns {Promise<void>} - A promise that resolves when the address predictions index is set.
         */
        ExtendableObject.setAddressPredictionsIndex = async (value) => {
            try {
                const resolvedValue = await ExtendableObject.util.Promise.resolve(value);
                const newValue = parseInt(resolvedValue, 10); // Ensure it's parsed as base-10 integer

                if (ExtendableObject._addressPredictionsIndex !== newValue) {
                    ExtendableObject._addressPredictionsIndex = newValue;

                    // Inform all subscribers about the change.
                    const notificationProcesses = [];

                    ExtendableObject._subscribers.addressPredictionsIndex.forEach((subscriber) => {
                        try {
                            notificationProcesses.push(
                                subscriber.updateDOMValue(newValue)
                            );
                        } catch (subErr) {
                            console.warn('Failed to update addressPredictionsIndex subscriber:', {
                                error: subErr,
                                value: resolvedValue
                            });
                        }
                    });
                    await Promise.all(notificationProcesses);
                }
            } catch (err) {
                console.warn('Error setting addressPredictionsIndex:', {
                    error: err,
                    value
                });
            }
        };
    },

    registerEventCallbacks: (ExtendableObject) => {
        /**
         * Creates an address change event handler for a subscriber.
         * @param {Object} subscriber - The subscriber object containing the value to set.
         * @returns {Function} - An event handler function that updates the address.
         */
        ExtendableObject.cb.addressChange = (subscriber) => {
            return (e) => {
                ExtendableObject.address = subscriber.value;
            };
        };

        /**
         * Creates an address status change event handler for a subscriber.
         * @param {Object} subscriber - The subscriber object containing the value to set.
         * @returns {Function} - An event handler function that updates the address status.
         */
        ExtendableObject.cb.addressStatusChange = (subscriber) => {
            return (e) => {
                ExtendableObject.addressStatus = subscriber.value;
            };
        };

        /**
         * Creates an address predictions index change event handler for a subscriber.
         * @param {Object} subscriber - The subscriber object containing the value to set.
         * @returns {Function} - An event handler function that updates the address predictions index.
         */
        ExtendableObject.cb.addressPredictionsIndexChange = (subscriber) => {
            return (e) => {
                ExtendableObject.addressPredictionsIndex = subscriber.value;
            };
        };
    },

    /**
     * Registers utility functions for the AddressExtension.
     * @param {Object} ExtendableObject - The object to extend with utility methods.
     */
    registerUtilities: (ExtendableObject) => {
        /**
         * Removes status indications from all address fields.
         */
        ExtendableObject.util.removeStatusIndication = () => {
            ExtendableObject.util.indicateStatuscodes(
                []
            );
        };

        /**
         * Invalidates address metadata and marks the address as dirty.
         */
        ExtendableObject.util.invalidateAddressMeta = () => {
            ExtendableObject.addressStatus = [];
            ExtendableObject.addressPredictions = [];
            ExtendableObject.util.removeStatusIndication();
            ExtendableObject.util.markAddressDirty();
        };

        /**
         * Checks if the address check process is finished.
         * @returns {boolean} - True if the address check is finished, false otherwise.
         */
        ExtendableObject.util.isAddressCheckFinished = () => {
            const validStatuses = ['address_selected_by_customer', 'address_selected_automatically'];

            return validStatuses.some(status => ExtendableObject._addressStatus.includes(status));
        };

        /**
         * Marks the address as dirty, indicating it needs validation.
         */
        ExtendableObject.util.markAddressDirty = () => {
            ExtendableObject._changed = true;
            ExtendableObject.forms.forEach((form) => {
                form.setAttribute('endereco-form-needs-validation', true);
            });
        };

        /**
         * Initiates an address check process, utilizing caching if available.
         * @param {...any} args - Additional arguments passed to the address check process.
         * @returns {Promise} - A promise representing the address check process.
         */
        ExtendableObject.util.checkAddress = (...args) => {
            const integrator = window.EnderecoIntegrator;
            const address = ExtendableObject.address;
            const key = [
                ExtendableObject.id,
                generateAddressCacheKey(address)
            ].join('--');

            // Is it already cached?
            if (integrator.processQueue.has(key)) {
                return integrator.processQueue.get(key);
            }

            // Start the process
            const promise = ExtendableObject.util.processAddressCheck(...args);

            // Save in queue immediately
            integrator.processQueue.set(key, promise);

            // When finished, remove from queue
            promise.finally(() => {
                integrator.processQueue.delete(key);
            });

            return promise;
        };

        /**
         * Determines the type of user feedback required based on address check results.
         * @param {Object} address - The original address object.
         * @param {Array} predictions - An array of address predictions.
         * @param {string[]} statuscodes - An array of status codes from the address check.
         * @returns {Promise|undefined} - A promise for user feedback if needed, undefined otherwise.
         */
        ExtendableObject.util.getUserFeedback = (address, predictions, statuscodes) => {
            // Case when there are multiple predictions
            const isExpectedToHavePredictions = statuscodes.includes('address_multiple_variants') ||
                statuscodes.includes('address_needs_correction');

            if (predictions.length > 0 && isExpectedToHavePredictions) {
                return ExtendableObject.util.getPredictionsAndMetaFeedback(
                    address,
                    predictions,
                    statuscodes
                );
            }

            // Case when there are no predictions
            // predictions.length === 0 is fallback for older implementation of housenumber not found
            if (statuscodes.includes('address_not_found') || predictions.length === 0) {
                return ExtendableObject.util.getOnlyMetaFeedback(
                    address,
                    predictions,
                    statuscodes
                );
            }
        };

        /**
         * Retrieves only meta feedback for an address without predictions.
         * @param {Object} originalAddress - The original address object.
         * @param {Array} predictions - An array of address predictions (expected to be empty).
         * @param {string[]} statuscodes - An array of status codes from the address check.
         * @returns {Promise<Object>} - A promise resolving to an object with user feedback details.
         */
        ExtendableObject.util.getOnlyMetaFeedback = async (originalAddress, predictions, statuscodes) => {
            // Increase counter to kind of show, that we have a modal here.
            window.EnderecoIntegrator.popupQueue++;
            window.EnderecoIntegrator.enderecoPopupQueue++;

            try {
                await ExtendableObject.waitForPopupAreaToBeFree();

                // Is the original address and the address used for address check still the same?
                if (generateAddressCacheKey(originalAddress) !== generateAddressCacheKey(ExtendableObject.address)) {
                    window.EnderecoIntegrator.popupQueue--;
                    window.EnderecoIntegrator.enderecoPopupQueue--;

                    return;
                }

                // Prepare main address.
                // TODO: replace button then replace button classes.
                const mainAddressHtml = ExtendableObject.util.formatAddress(originalAddress, statuscodes, true, true);
                const editButtonHTML = ExtendableObject.config.templates.buttonEditAddress.replace('{{{buttonClasses}}}', ExtendableObject.config.templates.primaryButtonClasses);
                const confirmButtonHTML = ExtendableObject.config.templates.buttonConfirmAddress.replace('{{{buttonClasses}}}', ExtendableObject.config.templates.secondaryButtonClasses);

                const errorResolution = generateAddressValidationErrors(ExtendableObject, statuscodes);

                const modalHTML = ExtendableObject.util.Mustache.render(
                    ExtendableObject.config.templates.addressNoPredictionWrapper
                        .replace('{{{button}}}', editButtonHTML)
                        .replace('{{{buttonSecondary}}}', confirmButtonHTML)
                    ,
                    {
                        EnderecoAddressObject: ExtendableObject,
                        direction: getComputedStyle(document.querySelector('body')).direction,
                        modalClasses: errorResolution.invalidFields.join(' '),
                        showClose: ExtendableObject.config.ux.allowCloseModal,
                        hasErrors: errorResolution.fieldErrors.length > 0,
                        errors: errorResolution.fieldErrors,
                        showConfirCheckbox: ExtendableObject.config.ux.confirmWithCheckbox,
                        mainAddress: mainAddressHtml,
                        button: ExtendableObject.config.templates.button,
                        title: ExtendableObject.config.texts.popupHeadlines[ExtendableObject.addressType]
                    }
                );

                document.querySelector('body').insertAdjacentHTML('beforeend', modalHTML);
                document.querySelector('body').classList.add('endereco-no-scroll');

                ExtendableObject.onAfterModalRendered.forEach(function (cb) {
                    cb(ExtendableObject);
                });

                const modalElement = document.querySelector('[endereco-popup]');

                return new Promise((resolve) => {
                    attachModalCloseHandlers(ExtendableObject, modalElement, () => {
                        resolve({
                            userHasEditingIntent: true,
                            userConfirmedSelection: false,
                            selectedAddress: originalAddress
                        });
                    });
                    attachEditAddressHandlers(ExtendableObject, modalElement, () => {
                        resolve({
                            userHasEditingIntent: true,
                            userConfirmedSelection: false,
                            selectedAddress: originalAddress
                        });
                    });
                    attachConfirmationCheckboxHandlers(ExtendableObject, modalElement);
                    attachConfirmAddressHandlers(ExtendableObject, modalElement, () => {
                        resolve({
                            userHasEditingIntent: false,
                            userConfirmedSelection: true,
                            selectedAddress: originalAddress
                        });
                    });
                });
            } catch (error) {
                // Handle any errors that occur during the async operations
                console.warn('Error in getOnlyMetaFeedback:', error);
                window.EnderecoIntegrator.popupQueue--;
                window.EnderecoIntegrator.enderecoPopupQueue--;

                return new Promise((resolve) => {
                    // Decide how to resolve the promise in case of error
                    resolve({
                        userHasEditingIntent: false,
                        userConfirmedSelection: false,
                        selectedAddress: originalAddress,
                        error
                    });
                });
            }
        };

        /**
         * Retrieves predictions and meta feedback for an address with multiple variants.
         * @param {Object} originalAddress - The original address object.
         * @param {Array} predictions - An array of address predictions.
         * @param {string[]} statuscodes - An array of status codes from the address check.
         * @returns {Promise<Object>} - A promise resolving to an object with user feedback details.
         */
        ExtendableObject.util.getPredictionsAndMetaFeedback = async (originalAddress, predictions, statuscodes) => {
            // Increase counter to kind of show, that we have a modal here.
            window.EnderecoIntegrator.popupQueue++;
            window.EnderecoIntegrator.enderecoPopupQueue++;

            await ExtendableObject.waitForPopupAreaToBeFree();

            // Is the original address and the address used for address check still the same?
            if (generateAddressCacheKey(originalAddress) !== generateAddressCacheKey(ExtendableObject.address)) {
                window.EnderecoIntegrator.popupQueue--;
                window.EnderecoIntegrator.enderecoPopupQueue--;

                return;
            }

            // Popup needed.
            const mainAddressHtml = ExtendableObject.util.formatAddress(originalAddress, statuscodes);
            const firstPrediction = ExtendableObject.util.formatAddress(predictions[0], statuscodes);
            let mainAddressDiffHtml = '';

            // Calculate main address diff.
            const diff = diffWords(mainAddressHtml, firstPrediction, { ignoreCase: false });

            diff.forEach((part) => {
                const markClass = part.added
                    ? 'endereco-span--add'
                    : part.removed ? 'endereco-span--remove' : 'endereco-span--neutral';

                mainAddressDiffHtml += `<span class="${markClass}">${part.value}</span>`;
            });

            // Prepare predictions.
            const processedPredictions = [];

            predictions.forEach((addressPrediction) => {
                const addressFormatted = ExtendableObject.util.formatAddress(addressPrediction, statuscodes);
                let addressDiff = '';
                const diff = diffWords(mainAddressHtml, addressFormatted, { ignoreCase: false });

                diff.forEach((part) => {
                    const markClass = part.added
                        ? 'endereco-span--add'
                        : part.removed ? 'endereco-span--remove' : 'endereco-span--neutral';

                    addressDiff += `<span class="${markClass}">${part.value}</span>`;
                });

                processedPredictions.push({
                    addressDiff
                });
            });

            // Render wrapper.
            let indexCounter = 0;
            const useButtonHTML = ExtendableObject.config.templates.button.replace('{{{buttonClasses}}}', ExtendableObject.config.templates.primaryButtonClasses);
            const predictionsWrapperHtml = ExtendableObject.util.Mustache.render(
                ExtendableObject.config.templates.addressPredictionsPopupWrapper.replace('{{{button}}}', useButtonHTML),
                {
                    EnderecoAddressObject: ExtendableObject,
                    direction: getComputedStyle(document.querySelector('body')).direction,
                    predictions: processedPredictions,
                    mainAddress: mainAddressDiffHtml,
                    showClose: ExtendableObject.config.ux.allowCloseModal,
                    showConfirCheckbox: ExtendableObject.config.ux.confirmWithCheckbox,
                    button: ExtendableObject.config.templates.button,
                    title: ExtendableObject.config.texts.popupHeadlines[ExtendableObject.addressType],
                    index: function () {
                        return indexCounter;
                    },
                    loopUp: function () {
                        indexCounter++;

                        return '';
                    }
                }
            );

            document.querySelector('body').insertAdjacentHTML('beforeend', predictionsWrapperHtml);
            document.querySelector('body').classList.add('endereco-no-scroll');

            ExtendableObject.onAfterModalRendered.forEach(function (cb) {
                cb(ExtendableObject);
            });

            const modalElement = document.querySelector('[endereco-popup]');

            return new Promise((resolve) => {
                attachModalCloseHandlers(ExtendableObject, modalElement, () => {
                    resolve({
                        userHasEditingIntent: true,
                        userConfirmedSelection: false,
                        selectedAddress: originalAddress
                    });
                });

                attachEditAddressHandlers(ExtendableObject, modalElement, () => {
                    resolve({
                        userHasEditingIntent: true,
                        userConfirmedSelection: false,
                        selectedAddress: originalAddress
                    });
                });

                attachSelectionHandlers(ExtendableObject, modalElement, (selectedIndex) => {
                    resolve({
                        userHasEditingIntent: false,
                        userConfirmedSelection: true,
                        selectedAddress: (selectedIndex >= 0) ? predictions[selectedIndex] : originalAddress
                    });
                });
                attachPredictionsRadioHandlers(ExtendableObject, modalElement);
                attachConfirmationCheckboxHandlers(ExtendableObject, modalElement);
            });
        };

        /**
         * Processes an address check, handling automatic corrections and user feedback.
         * @returns {Promise<Object>} - A promise resolving to the final result of the address check.
         */
        ExtendableObject.util.processAddressCheck = async () => {
            const addressCheckRoutineCounter = ++ExtendableObject._addressCheckRoutineCounter;
            const allowedToAutocorrect = addressCheckRoutineCounter === 1;
            const addressToCheck = ExtendableObject.getAddress();
            const existingStatusCodes = ExtendableObject.getAddressStatus();
            const existingPredictions = ExtendableObject.getAddressPredictions();
            const processKey = [
                ExtendableObject.id,
                generateAddressCacheKey(addressToCheck)
            ].join('--');

            await waitForTurn(processKey);

            const finalResult = {
                address: addressToCheck,
                addressStatus: existingStatusCodes,
                addressPredictions: existingPredictions,
                sourceOfAddress: 'unverified_user_input',
                processStatus: 'started'
            };

            if (existingStatusCodes.includes('address_selected_by_customer')) {
                finalResult.sourceOfAddress = 'confirmed_user_selection';
                finalResult.processStatus = 'skipped';
                await ExtendableObject.util.indicateStatuscodes(
                    finalResult.addressStatus
                );

                return finalResult;
            }

            if (existingStatusCodes.includes('address_selected_automatically')) {
                finalResult.sourceOfAddress = 'automatic_copy_from_correction';
                finalResult.processStatus = 'skipped';
                await ExtendableObject.util.indicateStatuscodes(
                    finalResult.addressStatus
                );

                return finalResult;
            }

            // Get meta
            const { originalAddress, statuses, predictions, requestStatus } = await ExtendableObject.util.getAddressMeta(addressToCheck);

            if (requestStatus !== 'success') {
                finalResult.processStatus = 'network_error';

                return finalResult;
            }

            if (generateAddressCacheKey(addressToCheck) !== generateAddressCacheKey(ExtendableObject.address)) {
                finalResult.processStatus = 'invalid_result';

                return finalResult;
            }

            if (ExtendableObject.anyMissing() || ExtendableObject.areEssentialsDisabled()) {
                finalResult.processStatus = 'invalid_result';

                return finalResult;
            }

            const autocorrectNeeded = allowedToAutocorrect &&
                (isAutomaticCorrection(statuses) || isAddressCorrect(statuses));
            const manualActionNeeded = (isPredictionOrMetaFeedbackNeeded(statuses, predictions) ||
                isOnlyMetaFeedbackNeeded(statuses, predictions)) && !autocorrectNeeded;

            if (autocorrectNeeded) {
                const autoCorrectionAddress = predictions[0];

                const {
                    originalAddress: finalAddress,
                    statuses: finalStatuses,
                    predictions: finalPredictions,
                    requestStatus: finalRequestStatus
                } = await ExtendableObject.util.getAddressMeta(autoCorrectionAddress);

                if (finalRequestStatus !== 'success') {
                    finalResult.processStatus = 'network_error';

                    return finalResult;
                }

                if (generateAddressCacheKey(addressToCheck) !== generateAddressCacheKey(ExtendableObject.address)) {
                    finalResult.processStatus = 'invalid_result';

                    return finalResult;
                }

                if (ExtendableObject.anyMissing() || ExtendableObject.areEssentialsDisabled()) {
                    finalResult.processStatus = 'invalid_result';

                    return finalResult;
                }

                finalResult.address = finalAddress;
                finalResult.addressStatus = [...finalStatuses, 'address_selected_automatically'];
                finalResult.addressPredictions = finalPredictions;
                finalResult.sourceOfAddress = 'automatic_copy_from_correction';
                finalResult.processStatus = 'finished';
            }

            if (manualActionNeeded) {
                const userFeedback = await ExtendableObject.util.getUserFeedback(originalAddress, predictions, statuses);

                const {
                    originalAddress: finalAddress,
                    statuses: finalStatuses,
                    predictions: finalPredictions,
                    requestStatus: finalRequestStatus
                } = await ExtendableObject.util.getAddressMeta(userFeedback.selectedAddress);

                if (finalRequestStatus !== 'success') {
                    finalResult.processStatus = 'network_error';

                    return finalResult;
                }

                if (generateAddressCacheKey(addressToCheck) !== generateAddressCacheKey(ExtendableObject.address)) {
                    finalResult.processStatus = 'invalid_result';

                    return finalResult;
                }

                if (ExtendableObject.anyMissing() || ExtendableObject.areEssentialsDisabled()) {
                    finalResult.processStatus = 'invalid_result';

                    return finalResult;
                }

                if (userFeedback.userConfirmedSelection) {
                    finalResult.address = finalAddress;
                    finalResult.addressStatus = [...finalStatuses, 'address_selected_by_customer'];
                    finalResult.addressPredictions = finalPredictions;
                    finalResult.sourceOfAddress = 'confirmed_user_selection';
                    finalResult.processStatus = 'finished';
                }
            }

            if (!autocorrectNeeded && !manualActionNeeded) {
                if (generateAddressCacheKey(addressToCheck) !== generateAddressCacheKey(ExtendableObject.address)) {
                    finalResult.processStatus = 'invalid_result';

                    return finalResult;
                }

                if (ExtendableObject.anyMissing() || ExtendableObject.areEssentialsDisabled()) {
                    finalResult.processStatus = 'invalid_result';

                    return finalResult;
                }

                finalResult.addressStatus = [...statuses, 'address_selected_by_customer'];
                finalResult.sourceOfAddress = 'confirmed_user_selection';
                finalResult.processStatus = 'finished';
            }

            ExtendableObject._isIntegrityOperationSynchronous = true;
            await onBeforeResultPersisted(ExtendableObject, finalResult);
            try {
                await Promise.all([
                    ExtendableObject.setAddress(finalResult.address),
                    ExtendableObject.setAddressStatus(finalResult.addressStatus),
                    ExtendableObject.setAddressPredictions(finalResult.addressPredictions),
                    ExtendableObject.setAddressTimestamp(Math.floor(Date.now() / MILLISECONDS_IN_SECOND))
                ]);
            } catch (err) {
                // This will catch if any of the promises reject
                console.error('Failed updating the state in processAddressCheck', {
                    error: err
                });
            }
            await onAfterResultPersisted(ExtendableObject, finalResult);
            ExtendableObject._isIntegrityOperationSynchronous = false;

            // Display status codes
            await ExtendableObject.util.indicateStatuscodes(
                finalResult.addressStatus
            );

            return finalResult;
        };

        /**
         * Checks if the current intent is set to 'review'.
         * @returns {boolean} - True if the intent is 'review', false otherwise.
         */
        ExtendableObject.util.isReviewIntent = () => {
            return ExtendableObject.getIntent() === 'review';
        };

        /**
         * Preheats the address check cache with current address data if status exists.
         */
        ExtendableObject.util.preheatCache = () => {
            if (ExtendableObject.addressStatus.length === 0) {
                return;
            }

            const cacheKey = generateAddressCacheKey(ExtendableObject.address);

            const predictions = [...ExtendableObject.addressPredictions];

            const normalizedPredictions = predictions.map(addressPrediction => {
                const normalizedPrediction = { ...addressPrediction };

                // Fix for outdated format in the DB. Its might not contain the "streetFull" in the predictions
                if (Object.prototype.hasOwnProperty.call(ExtendableObject.address, 'countryCode')) {
                    normalizedPrediction.countryCode = addressPrediction.countryCode.toUpperCase();
                }

                if (Object.prototype.hasOwnProperty.call(ExtendableObject.address, 'streetFull')) {
                    // If prediction has streetFull, use it directly
                    if (Object.prototype.hasOwnProperty.call(addressPrediction, 'streetFull')) {
                        normalizedPrediction.streetFull = addressPrediction.streetFull;
                    } else {
                        // Otherwise, format it from other fields
                        normalizedPrediction.streetFull = ExtendableObject.util.formatStreetFull(
                            addressPrediction
                        );
                    }
                }

                return normalizedPrediction;
            });

            ExtendableObject.addressCheckCache.cachedResults[cacheKey] = {
                originalAddress: { ...ExtendableObject.address },
                predictions: normalizedPredictions,
                statuses: [...ExtendableObject.addressStatus],
                requestStatus: 'success'
            };
        };

        /**
         * Updates the status indications for address fields based on provided status codes.
         * @param {string[]} statuses - An array of status codes to indicate.
         */
        ExtendableObject.util.indicateStatuscodes = (statuses) => {
            // If statuses is empty, assign empty arrays to all field statuses
            if (!statuses || statuses.length === 0) {
                ExtendableObject.countryCodeStatus = [];
                ExtendableObject.subdivisionCodeStatus = [];
                ExtendableObject.postalCodeStatus = [];
                ExtendableObject.localityStatus = [];
                ExtendableObject.streetFullStatus = [];
                ExtendableObject.streetNameStatus = [];
                ExtendableObject.buildingNumberStatus = [];
                ExtendableObject.additionalInfoStatus = [];

                return;
            }

            // Country code
            const countryCodeCorrect = statuses.includes('address_correct') || statuses.includes('country_code_correct');
            const countryCodeStatus = countryCodeCorrect ? ['field_correct'] : ['field_not_correct'];

            // Subdivision code
            const subdivisionCodeCorrect = statuses.includes('address_correct') || statuses.includes('subdivision_code_correct');
            const subdivisionCodeStatus = subdivisionCodeCorrect ? ['field_correct'] : ['field_not_correct'];

            // Postal code
            const postalCodeCorrect = statuses.includes('address_correct') || statuses.includes('postal_code_correct');
            const postalCodeStatus = postalCodeCorrect ? ['field_correct'] : ['field_not_correct'];

            // Locality (cityName)
            const localityCorrect = statuses.includes('address_correct') || statuses.includes('locality_correct');
            const localityStatus = localityCorrect ? ['field_correct'] : ['field_not_correct'];

            // Street name
            const streetNameCorrect = statuses.includes('address_correct') || statuses.includes('street_name_correct');
            const streetNameStatus = streetNameCorrect ? ['field_correct'] : ['field_not_correct'];

            // Building number
            const buildingNumberCorrect = statuses.includes('address_correct') || statuses.includes('building_number_correct');
            const buildingNumberStatus = buildingNumberCorrect ? ['field_correct'] : ['field_not_correct'];

            // Additional info
            const additionalInfoCorrect = statuses.includes('address_correct') || statuses.includes('additional_info_correct');
            const additionalInfoStatus = additionalInfoCorrect ? ['field_correct'] : ['field_not_correct'];

            // Street full - Special case
            const streetFullCorrect = statuses.includes('address_correct') ||
                statuses.includes('street_full_correct') ||
                (statuses.includes('street_name_correct') && statuses.includes('building_number_correct'));
            const streetFullStatus = streetFullCorrect ? ['field_correct'] : ['field_not_correct'];

            // Set the status for each field, only if the field has a value
            ExtendableObject.countryCodeStatus = ExtendableObject.countryCode ? countryCodeStatus : [];
            ExtendableObject.subdivisionCodeStatus = ExtendableObject.subdivisionCode ? subdivisionCodeStatus : [];
            ExtendableObject.postalCodeStatus = ExtendableObject.postalCode ? postalCodeStatus : [];
            ExtendableObject.localityStatus = ExtendableObject.locality ? localityStatus : [];
            ExtendableObject.streetFullStatus = ExtendableObject.streetFull ? streetFullStatus : [];
            ExtendableObject.streetNameStatus = ExtendableObject.streetName ? streetNameStatus : [];
            ExtendableObject.buildingNumberStatus = ExtendableObject.buildingNumber ? buildingNumberStatus : [];
            ExtendableObject.additionalInfoStatus = ExtendableObject.additionalInfo ? additionalInfoStatus : [];
        };

        /**
         * Checks if a field has an active subscriber.
         * @param {string} fieldName - The name of the field to check.
         * @returns {boolean} - True if the field has an active subscriber, false otherwise.
         */
        ExtendableObject.util.hasSubscribedField = (fieldName) => {
            const subscribers = ExtendableObject._subscribers[fieldName] || [];
            const hasActiveSubscriber = subscribers.some((listener) => {
                const domElementExists = listener.object &&
                    !listener.object.disabled &&
                    listener.object.isConnected;

                return domElementExists && window.EnderecoIntegrator.hasActiveSubscriber(fieldName, listener.object, ExtendableObject);
            });

            return hasActiveSubscriber;
        };

        /**
         * Waits until the popup area is free of existing popups.
         * @returns {Promise<void>} - A promise that resolves when the popup area is free.
         */
        ExtendableObject.waitForPopupAreaToBeFree = async () => {
            while (true) {
                let isAreaFree = !document.querySelector('[endereco-popup]');

                // Check if the popup area is free
                isAreaFree = isAreaFree && await window.EnderecoIntegrator.isPopupAreaFree(ExtendableObject);

                if (isAreaFree) {
                    break;
                }

                await sleep(WAIT_FOR_TIME);
            }
        };

        /**
         * Waits until all popups are closed.
         * @returns {Promise<void>} - A promise that resolves when all popups are closed.
         */
        ExtendableObject.waitForAllPopupsToClose = async () => {
            while (true) {
                if (
                    undefined !== window.EnderecoIntegrator &&
                    undefined !== window.EnderecoIntegrator.popupQueue &&
                    window.EnderecoIntegrator.popupQueue === 0
                ) {
                    break;
                }

                await sleep(WAIT_FOR_TIME);
            }
        };

        /**
         * Determines if the address should be checked based on required fields and form validity.
         * @returns {boolean} - True if the address should be checked, false otherwise.
         */
        ExtendableObject.util.shouldBeChecked = () => {
            if (
                !ExtendableObject.countryCode ||
                (!ExtendableObject.streetName && !ExtendableObject.streetFull) ||
                !ExtendableObject.postalCode ||
                !ExtendableObject.locality
            ) {
                return false;
            }

            if (!window.EnderecoIntegrator.isAddressFormStillValid(ExtendableObject)) {
                return false;
            }

            return true;
        };

        /**
         * Formats an address into a string representation.
         * @param {Object} address - The address object to format.
         * @param {string[]} statuscodes - An array of status codes affecting formatting.
         * @param {boolean} [forceCountryDisplay=false] - Whether to force display of the country.
         * @param {boolean} [useHtml=false] - Whether to use HTML in the formatted output.
         * @returns {string} - The formatted address string.
         */
        ExtendableObject.util.formatAddress = (address, statuscodes, forceCountryDisplay = false, useHtml = false) => {
            // Format current address.
            const preparedData = { ...address };

            // Enrich address with countryName
            if (Boolean(window.EnderecoIntegrator.countryCodeToNameMapping) &&
                Boolean(window.EnderecoIntegrator.countryCodeToNameMapping[address.countryCode.toUpperCase()])
            ) {
                const textAreaForCountryName = document.createElement('textarea');

                textAreaForCountryName.innerHTML =
                    window.EnderecoIntegrator.countryCodeToNameMapping[address.countryCode.toUpperCase()];
                preparedData.countryName = textAreaForCountryName.value.toUpperCase();
            } else {
                preparedData.countryName = address.countryCode.toUpperCase();
            }

            if (Object.prototype.hasOwnProperty.call(address, 'subdivisionCode')) {
                if (Boolean(window.EnderecoIntegrator.subdivisionCodeToNameMapping) &&
                    Boolean(window.EnderecoIntegrator.subdivisionCodeToNameMapping[address.subdivisionCode.toUpperCase()])
                ) {
                    const textAreaForSubdivision = document.createElement('textarea');

                    textAreaForSubdivision.innerHTML =
                        window.EnderecoIntegrator.subdivisionCodeToNameMapping[address.subdivisionCode.toUpperCase()];
                    preparedData.subdivisionName = textAreaForSubdivision.value;
                } else {
                    if (address.subdivisionCode.toUpperCase()) {
                        preparedData.subdivisionName = address.subdivisionCode.toUpperCase().split('-')[1];
                    } else {
                        preparedData.subdivisionName = '&nbsp;';
                    }
                }
            }

            if (!address.buildingNumber || !(address.buildingNumber.trim())) {
                preparedData.buildingNumber = '&nbsp;';
            }

            if (statuscodes.includes('additional_info_is_missing')) {
                preparedData.additionalInfo = '&nbsp;';
            }

            // Workaround to display missing house number
            if (statuscodes.includes('building_number_is_missing') &&
                !Object.prototype.hasOwnProperty.call(address, 'streetName')
            ) {
                preparedData.streetName = preparedData.streetFull;
                delete preparedData.streetFull;
            }

            const isSubdivisionVisible = ExtendableObject.util.hasSubscribedField('subdivisionCode');

            preparedData.showSubdisivion = (preparedData.subdivisionName !== '&nbsp;') &&
                Object.prototype.hasOwnProperty.call(address, 'subdivisionCode') &&
                (
                    statuscodes.includes('subdivision_code_needs_correction') ||
                    statuscodes.includes('address_multiple_variants')
                ) &&
                isSubdivisionVisible;

            preparedData.useHtml = useHtml;
            preparedData.showCountry = forceCountryDisplay ||
                statuscodes.includes('country_code_needs_correction') ||
                statuscodes.includes('country_code_not_found');

            // Define which template to use
            let useTemplate = 'default';

            if (undefined !== ExtendableObject.config.templates.addressFull[address.countryCode.toLowerCase()]) {
                useTemplate = address.countryCode.toLowerCase();
            }
            const template = JSON.parse(JSON.stringify(ExtendableObject.config.templates.addressFull[useTemplate]));

            const formattedAddress = ExtendableObject.util.Mustache.render(
                template,
                preparedData
            ).replace(/  +/g, ' ');

            return formattedAddress;
        };

        /**
         * Removes the current popup from the DOM and resets related states.
         */
        ExtendableObject.util.removePopup = () => {
            if (document.querySelector('[endereco-popup]')) {
                document.querySelector('[endereco-popup]').parentNode.removeChild(document.querySelector('[endereco-popup]'));
                document.querySelector('body').classList.remove('endereco-no-scroll');
                ExtendableObject.addressPredictionsIndex = 0;
                window.EnderecoIntegrator.popupQueue--;
                window.EnderecoIntegrator.enderecoPopupQueue--;

                if (ExtendableObject.modalClosed) {
                    ExtendableObject.modalClosed();
                }
            }
        };

        /**
         * Determines if essential address fields are disabled.
         *
         * TODO: clarify the use case for this. As of now its transferred from the old AddressCheck Extension for
         *       eventual backward compatibility.
         *
         * @returns {boolean} True if essential locality and postal code are disabled, false otherwise
         */
        ExtendableObject.areEssentialsDisabled = () => {
            // Check if postal code subscribers exist and are available
            const hasPostalCodeSubscribers = ExtendableObject._subscribers?.postalCode?.length > 0;
            const hasLocalitySubscribers = ExtendableObject._subscribers?.locality?.length > 0;

            // If no subscribers exist for either type, essentials are not disabled
            if (!hasPostalCodeSubscribers && !hasLocalitySubscribers) {
                return false;
            }

            // Check if all postal code subscribers are disabled
            if (hasPostalCodeSubscribers) {
                const allPostalCodesDisabled = !ExtendableObject._subscribers.postalCode
                    .some(subscriber => !subscriber.object.disabled);

                if (allPostalCodesDisabled) {
                    return true; // All postal code DOM objects are disabled, address incomplete
                }
            }

            // Check if all locality subscribers are disabled
            if (hasLocalitySubscribers) {
                const allLocalitiesDisabled = !ExtendableObject._subscribers.locality
                    .some(subscriber => !subscriber.object.disabled);

                return allLocalitiesDisabled; // Return true if all localities are disabled
            }

            // If we reach here, most likely the address is complete.
            return false;
        };
    },

    /**
     * Registers API handler functions for the AddressExtension.
     * @param {Object} ExtendableObject - The object to extend with API-related methods.
     */
    registerAPIHandlers: (ExtendableObject) => {
        /**
         * Retrieves metadata for an address by making an API request or using cached results.
         * @param {Object} address - The address object to check, containing fields like countryCode, postalCode, etc.
         * @returns {Promise<Object>} - A promise resolving to an object containing the original address, statuses, predictions, and request status.
         */
        ExtendableObject.util.getAddressMeta = async (address) => {
            const addressToCheck = address;
            const checkResult = {
                originalAddress: addressToCheck,
                statuses: [],
                predictions: [],
                requestStatus: 'started'
            };

            // Check
            const addressCheckRequestIndex = ++ExtendableObject._addressCheckRequestIndex;
            const message = {
                jsonrpc: '2.0',
                id: addressCheckRequestIndex,
                method: 'addressCheck',
                params: {
                    country: address.countryCode,
                    language: ExtendableObject.config.lang,
                    postCode: address.postalCode,
                    cityName: address.locality
                }
            };

            if (Object.prototype.hasOwnProperty.call(addressToCheck, 'subdivisionCode')) {
                message.params.subdivisionCode = addressToCheck.subdivisionCode;
            }

            if (Object.prototype.hasOwnProperty.call(addressToCheck, 'streetName')) {
                message.params.street = addressToCheck.streetName;
            }

            if (Object.prototype.hasOwnProperty.call(addressToCheck, 'buildingNumber')) {
                message.params.houseNumber = addressToCheck.buildingNumber;
            }

            if (Object.prototype.hasOwnProperty.call(addressToCheck, 'streetFull')) {
                message.params.streetFull = addressToCheck.streetFull;
            }

            if (Object.prototype.hasOwnProperty.call(addressToCheck, 'additionalInfo')) {
                message.params.additionalInfo = addressToCheck.additionalInfo;
            }

            const cacheKey = generateAddressCacheKey(addressToCheck);

            const headers = {
                'X-Auth-Key': ExtendableObject.config.apiKey,
                'X-Agent': ExtendableObject.config.agentName,
                'X-Remote-Api-Url': ExtendableObject.config.remoteApiUrl,
                'X-Transaction-Referer': window.location.href,
                'X-Transaction-Id': ExtendableObject.hasLoadedExtension?.('SessionExtension')
                    ? ExtendableObject.sessionId
                    : 'not_required'
            };

            if (!ExtendableObject.addressCheckCache.cachedResults[cacheKey]) {
                try {
                    const EnderecoAPI = ExtendableObject.getEnderecoAPI();

                    if (!EnderecoAPI) {
                        console.warn('EnderecoAPI is not available');
                        checkResult.requestStatus = 'failed';

                        return checkResult;
                    }

                    const result = await EnderecoAPI.sendRequestToAPI(message, headers);

                    if (result?.data?.error?.code === ERROR_EXPIRED_SESSION) {
                        ExtendableObject.util.updateSessionId?.();
                    }

                    if (!result || !result.data || !result.data.result) {
                        console.warn("API didn't return a valid result");
                        checkResult.requestStatus = 'failed';

                        return checkResult;
                    }

                    // If session counter is set, increase it.
                    if (ExtendableObject.hasLoadedExtension('SessionExtension')) {
                        ExtendableObject.sessionCounter++;
                    }

                    const predictions = result.data.result.predictions.map((addressPrediction) => {
                        const normalizedPrediction = {};

                        // If the original address has countryCode, map from prediction's country
                        if (Object.prototype.hasOwnProperty.call(addressToCheck, 'countryCode')) {
                            normalizedPrediction.countryCode = addressPrediction.country.toUpperCase();
                        }

                        if (Object.prototype.hasOwnProperty.call(addressToCheck, 'subdivisionCode')) {
                            normalizedPrediction.subdivisionCode = addressPrediction.subdivisionCode;
                        }

                        if (Object.prototype.hasOwnProperty.call(addressToCheck, 'postalCode')) {
                            normalizedPrediction.postalCode = addressPrediction.postCode;
                        }

                        if (Object.prototype.hasOwnProperty.call(addressToCheck, 'locality')) {
                            normalizedPrediction.locality = addressPrediction.cityName;
                        }

                        if (Object.prototype.hasOwnProperty.call(addressToCheck, 'streetName')) {
                            normalizedPrediction.streetName = addressPrediction.street;
                        }

                        if (Object.prototype.hasOwnProperty.call(addressToCheck, 'buildingNumber')) {
                            normalizedPrediction.buildingNumber = addressPrediction.houseNumber;
                        }

                        if (Object.prototype.hasOwnProperty.call(addressToCheck, 'streetFull')) {
                            // If prediction has streetFull, use it directly
                            if (Object.prototype.hasOwnProperty.call(addressPrediction, 'streetFull')) {
                                normalizedPrediction.streetFull = addressPrediction.streetFull;
                            } else {
                                // Otherwise, format it from other fields
                                normalizedPrediction.streetFull = ExtendableObject.util.formatStreetFull(
                                    {
                                        countryCode: addressPrediction.country,
                                        streetName: addressPrediction.street,
                                        buildingNumber: addressPrediction.houseNumber
                                    }
                                );
                            }
                        }

                        if (Object.prototype.hasOwnProperty.call(addressToCheck, 'additionalInfo')) {
                            normalizedPrediction.additionalInfo = addressPrediction.additionalInfo;
                        }

                        return normalizedPrediction;
                    });

                    checkResult.statuses = result.data.result.status;
                    checkResult.predictions = predictions;

                    checkResult.requestStatus = 'success';
                    ExtendableObject.addressCheckCache.cachedResults[cacheKey] = checkResult;
                } catch (e) {
                    console.warn('AddressCheck against Endereco API failed', e, message);
                    checkResult.requestStatus = 'failed';

                    return checkResult;
                }
            }

            return ExtendableObject.addressCheckCache.cachedResults[cacheKey];
        };
    },

    /**
     * Registers filter callback functions for the AddressExtension.
     * @param {Object} ExtendableObject - The object to extend with filter callbacks.
     */
    registerFilterCallbacks: (ExtendableObject) => {
        /**
         * Creates a filter callback for setting an address, returning a promise that resolves with the address.
         * @param {Object} address - The address object to be set.
         * @returns {Promise<Object>} - A promise that resolves with the provided address object.
         */
        ExtendableObject.cb.setAddress = (address) => {
            return new ExtendableObject.util.Promise(function (resolve, reject) {
                resolve(address);
            });
        };
    },
    registerConfig: (ExtendableObject) => {
        ExtendableObject.config.templates.addressFull = addressFullTemplates;
        ExtendableObject.config.templates.addressPredictionsPopupWrapper = addressPredictionsPopupWrapper;
        ExtendableObject.config.templates.addressNotFoundPopupWrapper = addressNotFoundPopupWrapper;
        ExtendableObject.config.templates.addressNoPredictionWrapper = addressNoPredictionWrapper;

        if (!ExtendableObject.config.templates.button) {
            ExtendableObject.config.templates.button = '<button class="{{{buttonClasses}}}" endereco-use-selection endereco-disabled-until-confirmed>{{{EnderecoAddressObject.config.texts.useSelected}}}</button>';
        }

        if (!ExtendableObject.config.templates.buttonEditAddress) {
            ExtendableObject.config.templates.buttonEditAddress = '<button class="{{{buttonClasses}}}" endereco-edit-address>{{{EnderecoAddressObject.config.texts.editAddress}}}</button>';
        }

        if (!ExtendableObject.config.templates.buttonConfirmAddress) {
            ExtendableObject.config.templates.buttonConfirmAddress = '<button class="{{{buttonClasses}}}" endereco-confirm-address endereco-disabled-until-confirmed>{{{EnderecoAddressObject.config.texts.confirmAddress}}}</button>';
        }
    },
    extend: async (ExtendableObject) => {
        await ExtendableObject.waitForExtension([
            'CountryCodeExtension',
            'PostalCodeExtension',
            'LocalityExtension',
            'StreetNameExtension',
            'BuildingNumberExtension',
            'AdditionalInfoExtension'
        ]);

        await AddressExtension.registerProperties(ExtendableObject);
        await AddressExtension.registerFields(ExtendableObject);
        await AddressExtension.registerConfig(ExtendableObject);
        await AddressExtension.registerEventCallbacks(ExtendableObject);
        await AddressExtension.registerUtilities(ExtendableObject);
        await AddressExtension.registerAPIHandlers(ExtendableObject);
        await AddressExtension.registerFilterCallbacks(ExtendableObject);

        return AddressExtension;
    }
};

export default AddressExtension;

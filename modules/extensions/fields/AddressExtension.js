import addressFullTemplates from '../../../templates/addressFullTemplates';
import addressPredictionsPopupWrapper from '../../../templates/address_check_wrapper_template.html';
import addressNotFoundPopupWrapper from '../../../templates/address_not_found_wrapper_template.html';
import addressNoPredictionWrapper from '../../../templates/address_no_prediction_wrapper_template.html';
import { diffWords } from 'diff';
import EnderecoSubscriber from '../../subscriber';

const WAIT_FOR_TIME = 100;
const ERROR_EXPIRED_SESSION = -32700;
const MILLISECONDS_IN_SECOND = 1000;

const sleep = (ms) => {
    return new Promise(resolve => {
        const timer = setTimeout(() => {
            clearTimeout(timer);
            resolve();
        }, ms);
    });
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

const attachModalCloseHandlers = (ExtendableObject, modalElement, onClose) => {
    modalElement.querySelectorAll('[endereco-modal-close]').forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                onClose();
                ExtendableObject.onCloseModal.forEach(cb => cb(ExtendableObject));
                ExtendableObject.util.removePopup();
            } catch (err) {
                console.warn('Error in model close handler handler:', {
                    error: err,
                    dataObject: ExtendableObject
                });
            }
        });
    });
};

const attachEditAddressHandlers = (ExtendableObject, modalElement, onEdit) => {
    modalElement.querySelectorAll('[endereco-edit-address]').forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            try {
                onEdit();
                ExtendableObject.onEditAddress.forEach(cb => cb(ExtendableObject));
                ExtendableObject.util.removePopup();
            } catch (err) {
                console.warn('Error in model edit action handler:', {
                    error: err,
                    dataObject: ExtendableObject
                });
            }
        });
    });
};

const attachSelectionHandlers = (ExtendableObject, modalElement, onSelect) => {
    modalElement.querySelectorAll('[endereco-use-selection]').forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            try {
                onSelect(
                    parseInt(modalElement.querySelector("[name='endereco-address-predictions']:checked").value)
                );
                ExtendableObject.onAfterAddressCheckSelected.forEach(cb => cb(ExtendableObject));
                ExtendableObject.util.removePopup();
            } catch (err) {
                console.warn('Error in modal select correction handler:', {
                    error: err,
                    dataObject: ExtendableObject
                });
            }
        });
    });
};

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

const attachConfirmAddressHandlers = (ExtendableObject, modalElement, onConfirm) => {
    modalElement.querySelectorAll('[endereco-confirm-address]').forEach(element => {
        element.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await onConfirm();
            await ExtendableObject.waitUntilReady();
            ExtendableObject.onConfirmAddress.forEach(cb => cb(ExtendableObject));
            await ExtendableObject.waitUntilReady();
            ExtendableObject.util.removePopup();
        });
    });
};

const attachConfirmationCheckboxHandlers = (ExtendableObject, modalElement) => {
    if (!ExtendableObject.config.ux.confirmWithCheckbox) {
        return;
    }

    modalElement.querySelectorAll('[endereco-confirm-address-checkbox]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isChecked = e.target.checked;

            e.target.closest('.endereco-modal').querySelectorAll('[endereco-disabled-until-confirmed]').forEach(element => {
                element.disabled = !(isChecked || (ExtendableObject.addressPredictionsIndex >= 0));
            });
        });

        // Apply initial state
        const isChecked = checkbox.checked;

        checkbox.closest('.endereco-modal').querySelectorAll('[endereco-disabled-until-confirmed]').forEach(element => {
            element.disabled = !(isChecked || (ExtendableObject.addressPredictionsIndex >= 0));
        });
    });
};

const generateAddressValidationErrors = (ExtendableObject, statuscodes) => {
    const result = {
        fieldErrors: [],
        invalidFields: new Set()
    };

    // Helper to get text from config or fallback
    const getStatusText = (code, fallback) => {
        return fallback;
        // return window.EnderecoIntegrator.config.texts.statuses?.[code] || fallback;
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
                return isPackstation && statuscodes.includes('address_not_found');
            },
            fieldClass: 'endereco-invalid-packstation-address',
            messageId: 'packstation_has_unresolvable_address',
            defaultMessage: 'Die Packstation-Adresse konnte nicht gefunden werden.'
        },
        {
            validate: (ExtendableObject, statuscodes) => {
                return isPackstation && statuscodes.includes('address_not_found');
            },
            fieldClass: 'endereco-invalid-packstation-address',
            messageId: 'postoffice_has_unresolvable_address',
            defaultMessage: 'Die ostfilialen-Adresse konnte nicht gefunden werden.'
        },
        {
            validate: (ExtendableObject, statuscodes) => {
                return isPackstation &&
                    (statuscodes.includes('additional_info_needs_correction') ||
                        statuscodes.includes('additional_info_not_found'));
            },
            fieldClass: 'endereco-invalid-postnummer',
            messageId: 'packstation_has_unresolvable_postnummer',
            defaultMessage: 'Die Postnummer ist ungültig.'
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

const isAutomaticCorrection = (statuscodes) => {
    return statuscodes.includes('address_correct') || statuscodes.includes('address_minor_correction');
};

const isAddressCorrect = (statuscodes) => {
    return statuscodes.includes('address_correct');
};

const isPredictionOrMetaFeedbackNeeded = (statuscodes, predictions) => {
    // Case when there are multiple predictions
    return predictions.length > 0 &&
       (statuscodes.includes('address_multiple_variants') || statuscodes.includes('address_needs_correction'));
};

const isOnlyMetaFeedbackNeeded = (statuscodes, predictions) => {
    return statuscodes.includes('address_not_found') || predictions.length === 0;
};

const AddressExtension = {
    name: 'AddressExtension',
    registerProperties: (ExtendableObject) => {
        // Internal storage for field values
        ExtendableObject._addressStatus = [];
        ExtendableObject._addressPredictions = [];
        ExtendableObject._addressTimestamp = [];
        ExtendableObject._addressType = 'general_address';

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
        ExtendableObject.onEditAddress = [];
        ExtendableObject.onConfirmAddress = [];
    },
    registerFields: (ExtendableObject) => {
        // Add getter and setter for fields.
        Object.defineProperty(ExtendableObject, 'address', {
            get: () => {
                return ExtendableObject.getAddress();
            },
            set: async (value) => {
                await ExtendableObject.setAddress(value);
            }
        });
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
                return Array.isArray(ExtendableObject._addressStatus)
                    ? ExtendableObject._addressStatus
                    : [];
            },
            set: async (value) => {
                ExtendableObject._awaits++;
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

                    ExtendableObject._addressStatus = decodedValue;

                    // Update subscribers with error handling
                    ExtendableObject._subscribers.addressStatus.forEach(subscriber => {
                        try {
                            subscriber.value = Array.isArray(decodedValue)
                                ? decodedValue.join(',')
                                : String(decodedValue);
                        } catch (subErr) {
                            console.warn('Failed to update addressStatus subscriber:', {
                                error: subErr,
                                value: decodedValue
                            });
                        }
                    });
                } catch (err) {
                    console.warn('Error setting addressStatus:', {
                        error: err,
                        inputValue: value,
                        timestamp: new Date()
                    });
                    ExtendableObject._addressStatus = ExtendableObject._addressStatus || [];
                } finally {
                    ExtendableObject._awaits--;
                }
            }
        });

        Object.defineProperty(ExtendableObject, 'addressPredictions', {
            get: () => {
                return Array.isArray(ExtendableObject._addressPredictions)
                    ? ExtendableObject._addressPredictions
                    : [];
            },
            set: async (value) => {
                ExtendableObject._awaits++;
                try {
                    const resolvedValue = await ExtendableObject.util.Promise.resolve(value);

                    // Decode. The value can come from DOM element as string.
                    const decodedValue = (typeof resolvedValue === 'string')
                        ? JSON.parse(resolvedValue) || []
                        : Array.isArray(resolvedValue) ? resolvedValue : [];

                    ExtendableObject._addressPredictions = decodedValue;

                    ExtendableObject._subscribers.addressPredictions.forEach(subscriber => {
                        try {
                            subscriber.value = JSON.stringify(decodedValue);
                        } catch (subErr) {
                            console.warn('Failed to update addressPredictions subscriber:', {
                                error: subErr,
                                value: decodedValue
                            });
                        }
                    });
                } catch (err) {
                    console.warn('Error setting addressPredictions:', {
                        error: err,
                        inputValue: value,
                        timestamp: new Date()
                    });
                    ExtendableObject._addressPredictions = ExtendableObject._addressPredictions || [];
                } finally {
                    ExtendableObject._awaits--;
                }
            }
        });

        Object.defineProperty(ExtendableObject, 'addressType', {
            get: function () {
                return this._addressType;
            },
            set: function (value) {
                const oldValue = ExtendableObject._addressType;

                ExtendableObject._awaits++;
                ExtendableObject.util.Promise.resolve(value).then(function (value) {
                    if (!ExtendableObject.util.isEqual(oldValue, value)) {
                        ExtendableObject._addressType = value;
                        ExtendableObject._changed = false;

                        // Inform all subscribers about the change.
                        ExtendableObject._subscribers.addressType.forEach(function (subscriber) {
                            subscriber.value = value;
                        });

                        ExtendableObject.addressPredictions = [];
                        ExtendableObject.addressStatus = [];
                    }
                }).catch().finally(function () {
                    ExtendableObject._awaits--;
                });
            }
        });

        // Add getter and setter for fields.
        Object.defineProperty(ExtendableObject, 'addressTimestamp', {
            get: function () {
                return ExtendableObject._addressTimestamp;
            },
            set: function (value) {
                const oldValue = ExtendableObject._addressTimestamp;

                ExtendableObject._awaits++;
                ExtendableObject.util.Promise.resolve(value).then(function (value) {
                    const newValue = value;

                    if (!ExtendableObject.util.isEqual(oldValue, newValue)) {
                        ExtendableObject._addressTimestamp = newValue;

                        // Inform all subscribers about the change.
                        ExtendableObject._subscribers.addressTimestamp.forEach(function (subscriber) {
                            subscriber.value = value;
                        });
                    }
                }).catch().finally(function () {
                    ExtendableObject._awaits--;
                });
            }
        });

        // Add getter and setter for fields.
        Object.defineProperty(ExtendableObject, 'addressPredictionsIndex', {
            get: function () {
                return this._addressPredictionsIndex;
            },
            set: function (value) {
                ExtendableObject._awaits++;
                const oldValue = ExtendableObject._addressPredictionsIndex;

                ExtendableObject.util.Promise.resolve(value).then(function (value) {
                    const newValue = parseInt(value);

                    if (!ExtendableObject.util.isEqual(oldValue, newValue)) {
                        ExtendableObject._addressPredictionsIndex = newValue;

                        // Inform all subscribers about the change.
                        ExtendableObject._subscribers.addressPredictionsIndex.forEach(function (subscriber) {
                            subscriber.value = value;
                        });
                    }
                }).catch().finally(function () {
                    ExtendableObject._awaits--;
                });
            }
        });
    },
    registerEventCallbacks: (ExtendableObject) => {
        ExtendableObject.cb.addressChange = function (subscriber) {
            return function (e) {
                ExtendableObject.address = subscriber.value;
            };
        };

        // Add change event hadler.
        ExtendableObject.cb.addressStatusChange = function (subscriber) {
            return function (e) {
                ExtendableObject.addressStatus = subscriber.value;
            };
        };

        ExtendableObject.cb.addressPredictionsIndexChange = function (subscriber) {
            return function (e) {
                ExtendableObject.addressPredictionsIndex = subscriber.value;
            };
        };
    },
    registerUtilities: (ExtendableObject) => {
        ExtendableObject.util.removeStatusIndication = () => {
            ExtendableObject.util.indicateStatuscodes(
                []
            );
        };

        ExtendableObject.util.invalidateAddressMeta = () => {
            ExtendableObject.addressStatus = [];
            ExtendableObject.addressPredictions = [];
            ExtendableObject.util.removeStatusIndication();

            ExtendableObject._changed = true;

            ExtendableObject.forms.forEach((form) => {
                form.setAttribute('endereco-form-needs-validation', true);
            });
        };

        ExtendableObject.util.checkAddress = (...args) => {
            const integrator = window.EnderecoIntegrator;
            const address = ExtendableObject.address;
            const key = generateAddressCacheKey(address);

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
                console.error('Error in getOnlyMetaFeedback:', error);
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

            diff.forEach(function (part) {
                const markClass = part.added
                    ? 'endereco-span--add'
                    : part.removed ? 'endereco-span--remove' : 'endereco-span--neutral';

                mainAddressDiffHtml += `<span class="${markClass}">${part.value}</span>`;
            });

            // Prepare predictions.
            const processedPredictions = [];

            predictions.forEach(function (addressPrediction) {
                const addressFormatted = ExtendableObject.util.formatAddress(addressPrediction, statuscodes);
                let addressDiff = '';
                const diff = diffWords(mainAddressHtml, addressFormatted, { ignoreCase: false });

                diff.forEach(function (part) {
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

        ExtendableObject.util.processAddressCheck = async () => {
            const addressCheckRoutineCounter = ++ExtendableObject._addressCheckRoutineCounter;
            const allowedToAutocorrect = addressCheckRoutineCounter === 1;
            const addressToCheck = ExtendableObject.address;
            const processKey = generateAddressCacheKey(addressToCheck);
            const existingStatusCodes = ExtendableObject.addressStatus;
            const existingPredictions = ExtendableObject.addressPredictions;

            await waitForTurn(processKey);


            const finalResult = {
                address: addressToCheck,
                addressStatus: existingStatusCodes,
                addressPredictions: existingPredictions,
                sourceOfAddress: 'unverified_user_input'
            };

            if (existingStatusCodes.includes('address_selected_by_customer')) {
                finalResult.sourceOfAddress = 'confirmed_user_selection';

                await ExtendableObject.util.indicateStatuscodes(
                    finalResult.addressStatus
                );
                return finalResult;
            }

            if (existingStatusCodes.includes('address_selected_automatically')) {
                finalResult.sourceOfAddress = 'automatic_copy_from_correction';

                await ExtendableObject.util.indicateStatuscodes(
                    finalResult.addressStatus
                );
                return finalResult;
            }

            // Get meta
            const { originalAddress, statuses, predictions } = await ExtendableObject.util.getAddressMeta(addressToCheck);

            if (generateAddressCacheKey(addressToCheck) !== generateAddressCacheKey(ExtendableObject.address)) {
                console.log('Skip address cache result because address changed');

                return finalResult;
            }

            const autocorrectNeeded = (allowedToAutocorrect && isAutomaticCorrection(statuses)) ||
                isAddressCorrect(statuses);
            const manualActionNeeded = (isPredictionOrMetaFeedbackNeeded(statuses, predictions) ||
                isOnlyMetaFeedbackNeeded(statuses, predictions)) && !autocorrectNeeded;

            if (autocorrectNeeded) {
                const autoCorrectionAddress = predictions[0];

                const {
                    originalAddress: finalAddress,
                    statuses: finalStatuses,
                    predictions: finalPredictions
                } = await ExtendableObject.util.getAddressMeta(autoCorrectionAddress);

                if (generateAddressCacheKey(addressToCheck) !== generateAddressCacheKey(ExtendableObject.address)) {
                    console.log('Skip address cache result because address changed');

                    return finalResult;
                }

                finalResult.address = finalAddress;
                finalResult.addressStatus = [...finalStatuses, 'address_selected_automatically'];
                finalResult.addressPredictions = finalPredictions;
                finalResult.sourceOfAddress = 'automatic_copy_from_correction';
            }

            if (manualActionNeeded) {
                const userFeedback = await ExtendableObject.util.getUserFeedback(originalAddress, predictions, statuses);

                const {
                    originalAddress: finalAddress,
                    statuses: finalStatuses,
                    predictions: finalPredictions
                } = await ExtendableObject.util.getAddressMeta(userFeedback.selectedAddress);

                if (userFeedback.userConfirmedSelection) {
                    finalResult.address = finalAddress;
                    finalResult.addressStatus = [...finalStatuses, 'address_selected_by_customer'];
                    finalResult.addressPredictions = finalPredictions;
                    finalResult.sourceOfAddress = 'confirmed_user_selection';
                }
            }

            await ExtendableObject.setAddress(finalResult.address);

            ExtendableObject.addressStatus = finalResult.addressStatus;
            ExtendableObject.addressPredictions = finalResult.addressPredictions;
            ExtendableObject.addressTimestamp = Math.floor(Date.now() / MILLISECONDS_IN_SECOND);

            // Display status codes
            await ExtendableObject.util.indicateStatuscodes(
                finalResult.addressStatus
            );

            return finalResult;
        };

        ExtendableObject.util.isReviewIntent = () => {
            // To be implemented
            return true;
        }

        ExtendableObject.util.preheatCache = () => {
            if (ExtendableObject.addressStatus.length == 0) {
                return;
            }

            const cacheKey = generateAddressCacheKey(ExtendableObject.address);

            ExtendableObject.addressCheckCache.cachedResults[cacheKey] = {
                originalAddress: {...ExtendableObject.address},
                predictions: [...ExtendableObject.addressPredictions],
                statuses:  [...ExtendableObject.addressStatus]
            }
        }

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

        ExtendableObject.util.hasSubscribedField = (fieldName) => {
            const subscribers = ExtendableObject._subscribers[fieldName] || [];
            const hasActiveSubscriber = subscribers.some((listener) => {
                return listener.object &&
                    !listener.object.disabled &&
                    listener.object.isConnected;
            });

            return hasActiveSubscriber;
        };

        ExtendableObject.waitForPopupAreaToBeFree = async function () {
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

        ExtendableObject.waitForAllEnderecoPopupsToClose = function () {
            return new ExtendableObject.util.Promise(function (resolve, reject) {
                const waitForFreePlace = setInterval(function () {
                    if (
                        undefined !== window.EnderecoIntegrator &&
                        undefined !== window.EnderecoIntegrator.enderecoPopupQueue &&
                        window.EnderecoIntegrator.enderecoPopupQueue === 0
                    ) {
                        clearInterval(waitForFreePlace);
                        resolve();
                    }
                }, WAIT_FOR_TIME);
            });
        };

        ExtendableObject.util.shouldBeChecked = function () {
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

            // Workaround to display missing house number
            if (statuscodes.includes('building_number_is_missing') &&
                !Object.prototype.hasOwnProperty.call(address, 'streetName')
            ) {
                preparedData.streetName = preparedData.streetFull;
                delete preparedData.streetFull;
            }

            const isSubdivisionVisible = ExtendableObject.util.hasSubscribedField('subdivisionCode');

            preparedData.showSubdisivion = (preparedData.subdivisionName !== '&nbsp;') &&
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

        ExtendableObject.util.removePopup = function () {
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
    },
    registerAPIHandlers: (ExtendableObject) => {
        ExtendableObject.util.getAddressMeta = async function (address) {
            const addressToCheck = address;
            const checkResult = {
                originalAddress: addressToCheck,
                statuses: [],
                predictions: []
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

                        return checkResult;
                    }

                    const result = await EnderecoAPI.sendRequestToAPI(message, headers);

                    if (result?.data?.error?.code === ERROR_EXPIRED_SESSION) {
                        ExtendableObject.util.updateSessionId?.();
                    }

                    if (!result || !result.data || !result.data.result) {
                        console.warn("API didn't return a valid result");

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

                    ExtendableObject.addressCheckCache.cachedResults[cacheKey] = checkResult;
                } catch (e) {
                    console.warn('AddressCheck against Endereco API failed', e, message);
                }
            }

            return ExtendableObject.addressCheckCache.cachedResults[cacheKey];
        };
    },
    registerFilterCallbacks: (ExtendableObject) => {
        ExtendableObject.cb.setAddress = function (address) {
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

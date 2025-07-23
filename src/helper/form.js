/**
 * Attaches validation listeners to a form and its submit-related elements.
 *
 * @param {HTMLFormElement} form - The form to attach listeners to
 * @returns {void}
 */
export const attachSubmitListenersToForm = (form) => {
    form.addEventListener('submit', triggerOnSubmitValidations);

    form.querySelectorAll('[type="submit"]').forEach(button => {
        button.addEventListener('click', triggerOnSubmitValidations);
    });

    if (form.id) {
        document.querySelectorAll(`button[form="${form.id}"], input[type="submit"][form="${form.id}"]`)
            .forEach(button => {
                button.addEventListener('click', triggerOnSubmitValidations);
            });
    }

    // Here custom integrations can define callbacks to add event listener to elements not covered by default
    // logic of this function
    if (window.EnderecoIntegrator?.customSubmitButtonHandlers) {
        window.EnderecoIntegrator.customSubmitButtonHandlers.forEach(handler => {
            try {
                handler(form, triggerOnSubmitValidations);
            } catch (error) {
                console.warn('Error in custom submit button handler:', error);
            }
        });
    }

    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('keydown', triggerOnSubmitValidations);
    });
};

/**
 * Triggers submit trigger process on form submission, intercepts the submit event if validation is needed,
 * and resumes submission after validation is complete.
 *
 * @async
 * @param {Event} e - The DOM event that triggered the form submission
 * @returns {boolean} - True if validation is not needed or successfully completed
 */
export const triggerOnSubmitValidations = async (e) => {
    const submitType = determineSubmitType(e);

    // Early escape
    if (!['submit', 'click', 'enter_keydown'].includes(submitType)) {
        return true;
    }

    const form = findFormReference(e, submitType);

    // Form found?
    if (!form) {
        return true;
    }

    if (!doesFormNeedValidation(form)) {
        return true;
    }

    unfocusFormElements(form);
    const submitListeners = getFormSubmitListeners(form);

    if (submitListeners.length === 0) {
        return true;
    }

    blockSubmit(e);

    try {
        unblockSubmitButton(form);
        const results = await letListenersHandleSubmit(submitListeners);
        const allFinished = results.every(result => result.processState === 'finished');

        if (!allFinished) {
            return false;
        }

        markFormAsClean(form);

        if (isAllowedToResumeSubmit()) {
            resumeFormSubmission(e, form);
        }
    } catch (error) {
        console.warn('Error during form validation:', error);
        markFormAsClean(form);

        if (isAllowedToResumeSubmit()) {
            resumeFormSubmission(e, form);
        }
    }
};

/**
 * Safely checks if form submission should be resumed after validation.
 * Checks for the existence of the EnderecoIntegrator and its configuration properties.
 *
 * @returns {boolean} - True if submission should be resumed, false otherwise
 */
const isAllowedToResumeSubmit = () => {
    try {
        // Check if EnderecoIntegrator exists
        if (!window.EnderecoIntegrator) {
            console.warn('EnderecoIntegrator not found in window object');

            return true; // Default to true for safety
        }

        // Check if config exists
        if (!window.EnderecoIntegrator.config) {
            console.warn('EnderecoIntegrator.config not found');

            return true; // Default to true for safety
        }

        // Check if ux config exists
        if (!window.EnderecoIntegrator.config.ux) {
            console.warn('EnderecoIntegrator.config.ux not found');

            return true; // Default to true for safety
        }

        // Check if resumeSubmit is defined, if not use default value true
        return window.EnderecoIntegrator.config.ux.resumeSubmit !== undefined
            ? window.EnderecoIntegrator.config.ux.resumeSubmit
            : true;
    } catch (error) {
        console.warn('Error checking if allowed to resume submit:', error);

        return true; // Default to true in case of any error
    }
};

/**
 * Safely unblocks a submit button on a form that was previously blocked by EnderecoIntegrator
 * Includes checks to prevent errors if objects don't exist
 *
 * @param {HTMLFormElement} form - The form element containing the submit button to unblock
 * @returns {boolean} - True if successful, false otherwise
 */
const unblockSubmitButton = (form) => {
    // Check if form is valid
    if (!form || !(form instanceof HTMLFormElement)) {
        console.warn('Invalid form element provided to unblockSubmitButton');

        return;
    }

    // Check if EnderecoIntegrator exists in window
    if (!window.EnderecoIntegrator) {
        console.warn('EnderecoIntegrator not found in window object');

        return;
    }

    // Check if the unblockSubmitButton method exists
    if (typeof window.EnderecoIntegrator.unblockSubmitButton !== 'function') {
        console.warn('unblockSubmitButton method not found in EnderecoIntegrator');

        return;
    }

    // If all assumption checks pass, call the method
    try {
        window.EnderecoIntegrator.unblockSubmitButton(form);
    } catch (err) {
        console.error('Error while unblocking submit button:', err);
    }
};

/**
 * Executes the handleFormSubmit method for each form submit listener.
 *
 * @async
 * @param {Array<{cb: {handleFormSubmit: function(): Promise<any>}}>} listeners - Array of listener objects
 * @returns {Promise<Array<any>>} Array of results from all listeners
 * @throws {Error} If any listener's handleFormSubmit fails
 */
const letListenersHandleSubmit = async (listeners) => {
    const results = [];
    const promises = listeners.map(listenerObject => {
        if (!listenerObject.util.shouldBeChecked()) {
            // Skip this listener and return a resolved promise
            return Promise.resolve();
        }

        // Check if onsubmit trigger is enabled for this specific listener object
        if (!listenerObject.config?.trigger?.onsubmit) {
            // Skip this listener and return a resolved promise
            return Promise.resolve();
        }

        return listenerObject.cb.handleFormSubmit()
            .then(result => {
                results.push(result);

                return result;
            });
    });

    if (promises.length > 0) {
        await Promise.all(promises);
    }

    return results;
};

/**
 * Safely retrieves form submit listeners for a given form from EnderecoIntegrator.
 *
 * @param {HTMLElement} form - The form element or identifier
 * @returns {Array} - Array of form submit listeners, or empty array if none exist
 */
const getFormSubmitListeners = (form) => {
    try {
        const listeners = window.EnderecoIntegrator?.formSubmitListeners?.get(form);

        return Array.isArray(listeners) ? listeners : [];
    } catch (err) {
        console.warn('Error getting form submit listeners:', err);

        return [];
    }
};

/**
 * Blocks the default form submission by preventing default behavior and stopping propagation.
 *
 * @param {Event} e - The event to block
 * @returns {void}
 */
const blockSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
};

/**
 * Checks if a form needs validation based on special endereco attribute.
 *
 * @param {HTMLFormElement} form - The form element to check
 * @returns {boolean} - True if the form needs validation, false otherwise
 * @throws {Error} - If no form element is provided
 */
const doesFormNeedValidation = (form) => {
    if (!form) {
        throw new Error('You need to provide a DOM element of the form to this function');
    }

    return form.hasAttribute('endereco-form-needs-validation') &&
        form.getAttribute('endereco-form-needs-validation');
};

/**
 * Unfocuses (blurs) all input elements in a form that might need validation.
 *
 * @param {HTMLFormElement} form - The form containing elements to unfocus
 * @returns {void}
 */
const unfocusFormElements = (form) => {
    if (!form || !(form instanceof HTMLFormElement)) {
        console.warn('Invalid form element provided to unfocusFormElements');

        return;
    }

    const formElements = form.querySelectorAll('input, select, textarea');

    formElements.forEach(element => {
        if (document.activeElement === element) {
            element.blur();
            element.dispatchEvent(
                new CustomEvent('blur', { bubbles: true, cancelable: true })
            );
        }
    });
};

/**
 * Attempts to find a form using custom form reference resolvers.
 *
 * @param {Event} e - The event that triggered the form submission
 * @param {string} submitType - The type of submission
 * @returns {HTMLFormElement|null} - The form element or null if not found
 */
const tryCustomFormReferenceResolvers = (e, submitType) => {
    for (const resolver of window.EnderecoIntegrator.customFormReferenceResolvers) {
        try {
            const customForm = resolver(e, submitType);

            if (customForm) {
                return customForm;
            }
        } catch (error) {
            console.warn('Error in custom form reference resolver:', error);
        }
    }

    return null;
};

/**
 * Finds the form reference based on the event and submit type.
 *
 * @param {Event} e - The event that triggered the form submission
 * @param {string} submitType - The type of submission ('submit', 'click', or 'enter_keydown')
 * @returns {HTMLFormElement|null} - The form element or null if not found
 */
const findFormReference = (e, submitType) => {
    let form = null;

    if (submitType === 'submit') {
        form = e.target;
    } else if (submitType === 'enter_keydown' || submitType === 'click') {
        form = e.target.closest('form');

        if (!form && e.target.hasAttribute('form')) {
            const formId = e.target.getAttribute('form');

            form = document.getElementById(formId);
        }

        // This part allows custom integrations to add their own logic to find the form reference
        if (!form && window.EnderecoIntegrator?.customFormReferenceResolvers) {
            form = tryCustomFormReferenceResolvers(e, submitType);
        }
    }

    return form;
};

/**
 * Determines the type of submit event based on the event properties.
 *
 * @param {Event} e - The event to analyze
 * @returns {string} - The submit type ('submit', 'click', 'enter_keydown', or 'unsupported')
 */
const determineSubmitType = (e) => {
    const type = 'unsupported';

    if (e.type === 'submit') {
        return 'submit';
    } else if (e.type === 'click') {
        return 'click';
    } else if (e.type === 'keydown' && e.key === 'Enter') {
        return 'enter_keydown';
    }

    return type;
};

/**
 * Marks a form as clean by removing the validation attribute.
 *
 * @param {HTMLFormElement} form - The form element to mark as clean
 * @returns {void}
 */
const markFormAsClean = (form) => {
    form.removeAttribute('endereco-form-needs-validation');
};

/**
 * Resumes form submission after validation by creating and dispatching a new event.
 *
 * @param {Event} originalEvent - The original event that triggered the validation
 * @param {HTMLFormElement} form - The form element to submit
 * @returns {void}
 */
const resumeFormSubmission = (originalEvent, form) => {
    let targetElement, newEvent;

    if (originalEvent.type === 'submit') {
        targetElement = form;
        newEvent = new Event('submit', { bubbles: true, cancelable: true });
    } else if (originalEvent.type === 'click') {
        const originalButton = originalEvent.target;

        if (!originalButton || originalButton.type !== 'submit') return;
        targetElement = originalButton;
        newEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
    } else if (originalEvent.type === 'keydown' && originalEvent.key === 'Enter') {
        const originalElement = originalEvent.target;

        if (!originalElement) return;
        targetElement = originalElement;
        newEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        });
    } else {
        return; // Unsupported event type
    }

    const wasNotCanceled = targetElement.dispatchEvent(newEvent);

    if (originalEvent.type === 'submit' && wasNotCanceled) {
        form.submit();
    }
};

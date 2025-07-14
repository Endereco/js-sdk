const PhoneExtension = {
    name: 'PhoneExtension',
    extend: function (ExtendableObject) {
        const $self = this;

        return new ExtendableObject.util.Promise(function (resolve, reject) {
            ExtendableObject._phone = '';
            ExtendableObject._subscribers.phone = [];

            ExtendableObject.cb.setPhone = function (phone) {
                return new ExtendableObject.util.Promise(function (resolve, reject) {
                    resolve(phone);
                });
            };

            ExtendableObject.cb.phoneChange = function (subscriber) {
                return function (e) {
                    ExtendableObject.phone = subscriber.value;
                    ExtendableObject._changed = true;
                };
            };

            ExtendableObject.cb.phoneInput = function (subscriber) {
                return function (e) {
                    ExtendableObject.phone = subscriber.value;
                    ExtendableObject._changed = true;
                };
            };

            ExtendableObject.cb.phoneBlur = function (subscriber) {
                return function (subscriber) {
                    ExtendableObject.waitUntilReady().then(function () {
                        if (ExtendableObject.onBlurTimeout) {
                            clearTimeout(ExtendableObject.onBlurTimeout);
                            ExtendableObject.onBlurTimeout = null;
                        }
                        ExtendableObject.onBlurTimeout = setTimeout(function () {
                            let newStatus;

                            if (!ExtendableObject.anyActive() && ExtendableObject.util.shouldBeChecked() && !window.EnderecoIntegrator.hasSubmit) {
                                // Second. Check Address.
                                clearTimeout(ExtendableObject.onBlurTimeout);
                                ExtendableObject.onBlurTimeout = null;

                                if (ExtendableObject.active && ExtendableObject.hasLoadedExtension('PhoneCheckExtension')) {
                                    ExtendableObject._awaits++;
                                    ExtendableObject.phoneStatus = [];
                                    ExtendableObject.util.checkPhone().then(function (data) {
                                        // If format is defined, rewrite field.
                                        if (ExtendableObject.config.phoneFormat) {
                                            if (data.status.includes('phone_format_needs_correction')) {
                                                newStatus = data.status;

                                                newStatus.push('phone_correct');
                                                newStatus.push(`phone_format_${ExtendableObject.config.phoneFormat.toLowerCase()}`);

                                                if (newStatus.indexOf('phone_format_unknown') !== -1) {
                                                    newStatus.splice(
                                                        newStatus.indexOf('phone_format_unknown'),
                                                        1
                                                    );
                                                }

                                                if (newStatus.indexOf('phone_format_needs_correction') !== -1) {
                                                    newStatus.splice(
                                                        newStatus.indexOf('phone_format_needs_correction'),
                                                        1
                                                    );
                                                }

                                                if (newStatus.indexOf('phone_needs_correction') !== -1) {
                                                    newStatus.splice(
                                                        newStatus.indexOf('phone_needs_correction'),
                                                        1
                                                    );
                                                }

                                                ExtendableObject.phone = data.predictions[0].phone;
                                                ExtendableObject.phoneStatus = newStatus;
                                            } else {
                                                ExtendableObject.phoneStatus = data.status;
                                            }
                                        } else {
                                            ExtendableObject.phoneStatus = data.status;
                                        }
                                    }).catch(function (e) {
                                        ExtendableObject.phoneStatus = [];
                                        console.log('Failed checking phone', e, ExtendableObject);
                                    }).finally(function () {
                                        ExtendableObject._awaits--;
                                        ExtendableObject._changed = false;
                                    });
                                }
                            }
                        }, 300);
                    }).catch();
                };
            };

            // Add getter and setter for fields.
            Object.defineProperty(ExtendableObject, 'phone', {
                get: function () {
                    return this._phone;
                },
                set: function (value) {
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function (value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.cb.setPhone(value).then(function (value) {
                            const oldValue = ExtendableObject._phone;
                            const newValue = value;

                            const notSame = oldValue !== newValue;

                            if (notSame) {
                                ExtendableObject._phone = newValue;
                                ExtendableObject._changed = true;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.phone.forEach(function (subscriber) {
                                    subscriber.value = newValue;
                                });

                                if (ExtendableObject.active) {
                                    ExtendableObject.fire(
                                        new ExtendableObject.util.CustomEvent(
                                            'change',
                                            {
                                                detail: {
                                                    fieldName: 'phone',
                                                    oldValue,
                                                    newValue,
                                                    object: ExtendableObject
                                                }
                                            }
                                        )
                                    );
                                }
                            }
                        }).catch(function (e) {
                            if (ExtendableObject.config.showDebugInfo) {
                                console.log('Error resolving phoneFull', e);
                            }
                        }).finally(function () {
                            ExtendableObject._awaits--;
                        });
                    }).catch().finally(function () {
                        ExtendableObject._awaits--;
                    });
                }
            });

            ExtendableObject.fieldNames.push('phone');

            // Add smooth focus utility function
            ExtendableObject.util.focusElementSmoothly = function (element) {
                if (!element) return;

                // Focus without scrolling to prevent jumping
                element.focus({ preventScroll: true });

                // Then smoothly scroll into view
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest'
                });
            };

            // Add keyboard accessibility setup for phone flags
            ExtendableObject.util.setupPhoneFlagAccessibility = function () {
                // Wait for DOM to be ready and flags to be rendered
                setTimeout(() => {
                    const flagElements = document.querySelectorAll('.endereco-big-flag');

                    flagElements.forEach(flagElement => {
                        // Skip if already made accessible
                        if (flagElement.hasAttribute('data-accessibility-setup')) {
                            return;
                        }

                        // Make flag keyboard accessible
                        flagElement.setAttribute('tabindex', '0');
                        flagElement.setAttribute('role', 'button');
                        flagElement.setAttribute('aria-label', 'Select country code for phone number');
                        flagElement.setAttribute('aria-expanded', 'false');
                        flagElement.setAttribute('data-accessibility-setup', 'true');
                        // Add keyboard event listeners
                        flagElement.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();

                                // Find the dropdown element
                                const dropdownElement = flagElement.parentElement.querySelector('.endereco-flag-dropdown');

                                if (dropdownElement) {
                                    const isHidden = dropdownElement.classList.contains('endereco-hidden');

                                    // Toggle dropdown visibility
                                    dropdownElement.classList.toggle('endereco-hidden');
                                    flagElement.setAttribute('aria-expanded', isHidden);
                                    // Focus first dropdown item if opened
                                    if (isHidden) {
                                        setTimeout(() => {
                                            const firstItem = dropdownElement.querySelector('.endereco-flag-dropdown-element');

                                            if (firstItem) {
                                                ExtendableObject.util.focusElementSmoothly(firstItem);
                                            }
                                        }, 50);
                                    }
                                }
                            }

                            // ArrowDown/ArrowUp to open dropdown and focus first/last item
                            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                e.preventDefault();

                                const dropdownElement = flagElement.parentElement.querySelector('.endereco-flag-dropdown');

                                if (dropdownElement) {
                                    const isHidden = dropdownElement.classList.contains('endereco-hidden');

                                    if (isHidden) {
                                        // Open dropdown
                                        dropdownElement.classList.remove('endereco-hidden');
                                        flagElement.setAttribute('aria-expanded', 'true');
                                        // Focus first or last item based on arrow direction
                                        setTimeout(() => {
                                            const allItems = dropdownElement.querySelectorAll('.endereco-flag-dropdown-element');

                                            if (allItems.length > 0) {
                                                if (e.key === 'ArrowDown') {
                                                    ExtendableObject.util.focusElementSmoothly(allItems[0]); // Focus first item
                                                } else {
                                                    ExtendableObject.util.focusElementSmoothly(allItems[allItems.length - 1]); // Focus last item
                                                }
                                            }
                                        }, 50);
                                    }
                                }
                            }

                            // ESC key to close dropdown
                            if (e.key === 'Escape') {
                                const dropdownElement = flagElement.parentElement.querySelector('.endereco-flag-dropdown');

                                if (dropdownElement && !dropdownElement.classList.contains('endereco-hidden')) {
                                    dropdownElement.classList.add('endereco-hidden');
                                    flagElement.setAttribute('aria-expanded', 'false');
                                    flagElement.focus(); // Return focus to flag
                                }
                            }
                        });
                    });

                    // Make dropdown items keyboard accessible
                    const dropdownItems = document.querySelectorAll('.endereco-flag-dropdown-element');

                    dropdownItems.forEach((item, index) => {
                        // Skip if already made accessible
                        if (item.hasAttribute('data-accessibility-setup')) {
                            return;
                        }

                        item.setAttribute('tabindex', '0');
                        item.setAttribute('role', 'option');
                        item.setAttribute('data-accessibility-setup', 'true');

                        const countryName = item.querySelector('.endereco-country-code-col')?.textContent || '';
                        const phoneCode = item.querySelector('.endereco-phone-code-col')?.textContent || '';

                        item.setAttribute('aria-label', `${countryName} ${phoneCode}`);

                        item.addEventListener('keydown', (e) => {
                            const dropdown = item.closest('.endereco-flag-dropdown');
                            const allItems = dropdown.querySelectorAll('.endereco-flag-dropdown-element');
                            const currentIndex = Array.from(allItems).indexOf(item);

                            if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                const nextIndex = (currentIndex + 1) % allItems.length;

                                ExtendableObject.util.focusElementSmoothly(allItems[nextIndex]);
                            } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                const prevIndex = currentIndex === 0 ? allItems.length - 1 : currentIndex - 1;

                                ExtendableObject.util.focusElementSmoothly(allItems[prevIndex]);
                            } else if (e.key === 'Home') {
                                e.preventDefault();
                                // Jump to first item
                                ExtendableObject.util.focusElementSmoothly(allItems[0]);
                            } else if (e.key === 'End') {
                                e.preventDefault();
                                // Jump to last item
                                ExtendableObject.util.focusElementSmoothly(allItems[allItems.length - 1]);
                            } else if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                // Trigger the same click event
                                item.click();

                                // Return focus to the phone input field after selection
                                setTimeout(() => {
                                    const phoneInput = item.closest('.endereco-relative-container').querySelector('input[type="text"], input[type="tel"]');

                                    if (phoneInput) {
                                        phoneInput.focus();
                                        // Set cursor after prefix if it exists
                                        const value = phoneInput.value;
                                        let cursorPos = 0;
                                        // Find where the prefix ends (usually after a space or + sign)
                                        const match = value.match(/^(\+\d+\s*)/);

                                        if (match) {
                                            cursorPos = match[1].length;
                                        }
                                        if (phoneInput.setSelectionRange) {
                                            phoneInput.setSelectionRange(cursorPos, cursorPos);
                                        }
                                    }
                                }, 50);
                            } else if (e.key === 'Tab') {
                                // Tab navigation: accept selection and move to next/previous field
                                e.preventDefault();

                                // Apply the selection first
                                item.click();

                                // Close dropdown and navigate to next/previous field
                                setTimeout(() => {
                                    dropdown.classList.add('endereco-hidden');
                                    const flagElement = dropdown.parentElement.querySelector('.endereco-big-flag');

                                    if (flagElement) {
                                        flagElement.setAttribute('aria-expanded', 'false');
                                    }

                                    // Find all focusable elements in the page
                                    const focusableElements = document.querySelectorAll(
                                        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), ' +
                                        'button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), ' +
                                        'a[href]:not([disabled])'
                                    );

                                    const phoneInput = item.closest('.endereco-relative-container').querySelector('input[type="text"], input[type="tel"]');

                                    if (phoneInput && focusableElements.length > 0) {
                                        const currentIndex = Array.from(focusableElements).indexOf(phoneInput);

                                        if (e.shiftKey) {
                                            // Shift+Tab: go to previous field
                                            const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;

                                            focusableElements[prevIndex].focus();
                                        } else {
                                            // Tab: go to next field
                                            const nextIndex = (currentIndex + 1) % focusableElements.length;

                                            focusableElements[nextIndex].focus();
                                        }
                                    }
                                }, 50);
                            } else if (e.key === 'Escape') {
                                e.preventDefault();
                                dropdown.classList.add('endereco-hidden');
                                const flagElement = dropdown.parentElement.querySelector('.endereco-big-flag');

                                if (flagElement) {
                                    flagElement.setAttribute('aria-expanded', 'false');
                                    flagElement.focus();
                                }
                            }
                        });
                    });
                }, 100);
            };

            // Call the accessibility setup
            ExtendableObject.util.setupPhoneFlagAccessibility();

            // Setup observer for dynamically added flags
            if (!ExtendableObject._phoneFlagObserver) {
                ExtendableObject._phoneFlagObserver = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) {
                                const flags = node.querySelectorAll?.('.endereco-big-flag') || [];
                                const dropdownItems = node.querySelectorAll?.('.endereco-flag-dropdown-element') || [];

                                if (flags.length > 0 || dropdownItems.length > 0) {
                                    ExtendableObject.util.setupPhoneFlagAccessibility();
                                }
                            }
                        });
                    });
                });

                ExtendableObject._phoneFlagObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }

            if (ExtendableObject.config.showDebugInfo) {
                console.log('PhoneExtension applied');
            }

            resolve($self);
        });
    }
};

export default PhoneExtension;

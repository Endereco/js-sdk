import {diffWords} from "diff";
import addressFullTemplates from "../../../templates/addressFullTemplates";
import addressPredictionsPopupWrapper from "../../../templates/address_check_wrapper_template.html";
import addressNotFoundPopupWrapper from "../../../templates/address_not_found_wrapper_template.html";
import addressNoPredictionWrapper from '../../../templates/address_no_prediction_wrapper_template.html';

import EnderecoSubscriber from './../../subscriber.js';

var AddressCheckExtension = {
    name: 'AddressCheckExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('AddressExtension').then(function() {
                // Add email field.
                ExtendableObject._addressCheckRequestIndex = 1;
                ExtendableObject._addressStatus = [];
                ExtendableObject._subscribers.addressStatus = [];
                ExtendableObject._addressPredictions = [];
                ExtendableObject._subscribers.addressPredictions = [];
                ExtendableObject._addressPredictionsIndex = 0;
                ExtendableObject._subscribers.addressPredictionsIndex = [];
                ExtendableObject._addressTimestamp = [];
                ExtendableObject._subscribers.addressTimestamp = [];
                ExtendableObject._addressType = 'general_address';
                ExtendableObject._subscribers.addressType = [];

                ExtendableObject._checkedAddress = {};
                ExtendableObject._addressIsBeingChecked = false;

                // Callback collectors.
                ExtendableObject.onAfterAddressCheckNoAction = [];
                ExtendableObject.onAfterAddressCheck = [];
                ExtendableObject.onAfterAddressCheckSelected = [];
                ExtendableObject.onAfterModalRendered = [];
                ExtendableObject.onEditAddress = [];
                ExtendableObject.onConfirmAddress = [];


                ExtendableObject.config.templates.addressFull = addressFullTemplates;
                ExtendableObject.config.templates.addressPredictionsPopupWrapper = addressPredictionsPopupWrapper;
                ExtendableObject.config.templates.addressNotFoundPopupWrapper = addressNotFoundPopupWrapper;
                ExtendableObject.config.templates.addressNoPredictionWrapper = addressNoPredictionWrapper;

                ExtendableObject._globalStreetState = 1;

                if (!ExtendableObject.config.templates.button) {
                    ExtendableObject.config.templates.button = '<button class="{{{buttonClasses}}}" endereco-use-selection endereco-disabled-until-confirmed>{{{EnderecoAddressObject.config.texts.useSelected}}}</button>';
                }

                if (!ExtendableObject.config.templates.buttonEditAddress) {
                    ExtendableObject.config.templates.buttonEditAddress = '<button class="{{{buttonClasses}}}" endereco-edit-address>{{{EnderecoAddressObject.config.texts.editAddress}}}</button>';
                }

                if (!ExtendableObject.config.templates.buttonConfirmAddress) {
                    ExtendableObject.config.templates.buttonConfirmAddress = '<button class="{{{buttonClasses}}}" endereco-confirm-address endereco-disabled-until-confirmed>{{{EnderecoAddressObject.config.texts.confirmAddress}}}</button>';
                }

                ExtendableObject.onBlurTimeout = null;

                ExtendableObject.areEssentialsDisabled = function() {
                    let allPostalCodesDisabled = ExtendableObject._subscribers.postalCode.length > 0 && 
                        !ExtendableObject._subscribers.postalCode.some(subscriber => !subscriber.object.disabled);
    
                    if (allPostalCodesDisabled) {
                        return true; // If all postal code subscriber is not disabled, return false early
                    }

                    let allLocalitiesDisabled = ExtendableObject._subscribers.locality.length > 0 && 
                        !ExtendableObject._subscribers.locality.some(subscriber => !subscriber.object.disabled);
                    
                    return allLocalitiesDisabled; // Return true if all localities are disabled, false otherwise
                }

                ExtendableObject.waitForPopupAreaToBeFree = function() {
                    return new ExtendableObject.util.Promise(function(resolve, reject) {
                        var waitForFreePlace = setInterval(function() {
                            var isAreaFree = !document.querySelector('[endereco-popup]');

                            if (!!window.EnderecoIntegrator.$globalFilters && !!window.EnderecoIntegrator.$globalFilters.isModalAreaFree) {
                                window.EnderecoIntegrator.$globalFilters.isModalAreaFree.forEach( function(callback) {
                                    isAreaFree = callback(isAreaFree, $self);
                                });
                            }
                            
                            if(isAreaFree) {
                                clearInterval(waitForFreePlace);
                                resolve();
                            }
                        }, 100);
                    })
                }
                ExtendableObject.waitForAllPopupsToClose = function() {
                    return new ExtendableObject.util.Promise(function(resolve, reject) {
                        var waitForFreePlace = setInterval(function() {
                            if(
                                undefined !== window.EnderecoIntegrator &&
                                undefined !== window.EnderecoIntegrator.popupQueue &&
                                0 === window.EnderecoIntegrator.popupQueue
                            ) {
                                clearInterval(waitForFreePlace);
                                resolve();
                            }
                        }, 100);
                    })
                };
                ExtendableObject.waitForAllEnderecoPopupsToClose = function() {
                    return new ExtendableObject.util.Promise(function(resolve, reject) {
                        let waitForFreePlace = setInterval(function() {
                            if(
                                undefined !== window.EnderecoIntegrator &&
                                undefined !== window.EnderecoIntegrator.enderecoPopupQueue &&
                                0 === window.EnderecoIntegrator.enderecoPopupQueue
                            ) {
                                clearInterval(waitForFreePlace);
                                resolve();
                            }
                        }, 100);
                    })
                };

                ExtendableObject.util.shouldBeChecked = function() {
                    if (
                        !ExtendableObject.countryCode ||
                        (!ExtendableObject.streetName && !ExtendableObject.streetFull) ||
                        !ExtendableObject.postalCode ||
                        !ExtendableObject.locality
                    ) {
                        return false;
                    }

                    if (!['general_address', 'shipping_address', 'billing_address'].includes(ExtendableObject.addressType)) {
                        return false;
                    }

                    if (!ExtendableObject._changed) {
                        return false;
                    }

                    return true;
                }

                ExtendableObject.util.formatAddress = function(address=null, forceCountryDisplay = false, useHtml = false) {
                    var $self = ExtendableObject;
                    var useTemplate = 'default';
                    var formattedAddress = '';
                    var textArea;
                    var $subdivVisible = false;

                    if (!address) {
                        address = JSON.parse(JSON.stringify(ExtendableObject.address));
                    } else {
                        address = JSON.parse(JSON.stringify(address));
                    }

                    // Format current address.
                    if (undefined !== $self.config.templates.addressFull[$self.countryCode.toLowerCase()]) {
                        useTemplate = $self.countryCode.toLowerCase();
                    }

                    if (address.hasOwnProperty('countryCode')) {
                        if (!!window.EnderecoIntegrator.countryCodeToNameMapping && !!window.EnderecoIntegrator.countryCodeToNameMapping[address.countryCode.toUpperCase()]) {
                            address.countryName = window.EnderecoIntegrator.countryCodeToNameMapping[address.countryCode.toUpperCase()];
                            textArea = document.createElement('textarea');
                            textArea.innerHTML = address.countryName;
                            address.countryName = textArea.value.toUpperCase();

                        } else {
                            address.countryName = address.countryCode.toUpperCase();
                        }

                        address.showCountry = forceCountryDisplay || ExtendableObject.addressStatus.includes('country_code_needs_correction')
                    }

                    if (address.hasOwnProperty('subdivisionCode')) {
                        if (!!window.EnderecoIntegrator.subdivisionCodeToNameMapping && !!window.EnderecoIntegrator.subdivisionCodeToNameMapping[address.subdivisionCode.toUpperCase()]) {
                            address.subdivisionName = window.EnderecoIntegrator.subdivisionCodeToNameMapping[address.subdivisionCode.toUpperCase()];
                            textArea = document.createElement('textarea');
                            textArea.innerHTML = address.subdivisionName;
                            address.subdivisionName = textArea.value;
                        } else {
                            if (address.subdivisionCode.toUpperCase()) {
                                address.subdivisionName = address.subdivisionCode.toUpperCase().split("-")[1];
                            } else {
                                address.subdivisionName = "&nbsp;";
                            }
                        }

                        if ((0 < ExtendableObject._subscribers.subdivisionCode.length)) {
                            ExtendableObject._subscribers.subdivisionCode.forEach( function(listener) {
                                if (!listener.object.disabled
                                    && listener.object.isConnected) {
                                    $subdivVisible = true;
                                }
                            });
                        }

                        address.showSubdisivion = ("&nbsp;" !== address.subdivisionName)
                          && (
                            ExtendableObject.addressStatus.includes('subdivision_code_needs_correction') ||
                            ExtendableObject.addressStatus.includes('address_multiple_variants')
                          )
                          && $subdivVisible;
                    }

                    if (!address.buildingNumber || !(address.buildingNumber.trim())) {
                        address.buildingNumber = "&nbsp;";
                    }

                    address.useHtml = useHtml;

                    var template = JSON.parse(JSON.stringify($self.config.templates.addressFull[useTemplate]));

                    formattedAddress = ExtendableObject.util.Mustache.render(
                        template,
                        address
                    ).replace(/  +/g, ' ');

                    return formattedAddress;
                };

                ExtendableObject.util.renderAddressPredictionsPopup = function(options={onlyInner:false}) {
                    // Block a slot immediately.
                    if (undefined === window.EnderecoIntegrator) {
                        window.EnderecoIntegrator = {};
                    }
                    if (undefined === window.EnderecoIntegrator.popupQueue) {
                        window.EnderecoIntegrator.popupQueue = 0;
                        window.EnderecoIntegrator.enderecoPopupQueue = 0;
                    }
                    window.EnderecoIntegrator.popupQueue++;
                    window.EnderecoIntegrator.enderecoPopupQueue++;

                    // Check if empty object.
                    if (Object.keys(ExtendableObject._checkedAddress).length === 0 && ExtendableObject._checkedAddress.constructor === Object) {
                        ExtendableObject._checkedAddress = JSON.parse(JSON.stringify(ExtendableObject.address));
                    }

                    ExtendableObject.waitUntilReady().then( function() {
                        ExtendableObject.waitForPopupAreaToBeFree().then(function() {
                            var diff = [];
                            var $self = ExtendableObject;

                            // Render no popup.
                            if (ExtendableObject.addressStatus.includes('address_correct')) {
                                // No poup needed.
                                window.EnderecoIntegrator.popupQueue--;
                                window.EnderecoIntegrator.enderecoPopupQueue--;

                                ExtendableObject.onAfterAddressCheckNoAction.forEach( function(cb) {
                                    cb(ExtendableObject);
                                });

                                ExtendableObject.onAfterAddressCheck.forEach( function(cb) {
                                    cb(ExtendableObject);
                                });

                                // Call global submit resume function.
                                ExtendableObject.waitForAllEnderecoPopupsToClose().then(function() {
                                    if (window.EnderecoIntegrator && window.EnderecoIntegrator.submitResume) {
                                        ExtendableObject.beforeSubmitResume();
                                        window.EnderecoIntegrator.submitResume();
                                    }
                                }).catch()

                                return;
                            }

                            // Render popup with corrections.
                            if (
                                ExtendableObject.addressStatus.includes('address_multiple_variants') ||
                                ExtendableObject.addressStatus.includes('address_needs_correction') &&
                                    0 < ExtendableObject.addressPredictions.length &&
                                !(
                                    ExtendableObject.addressStatus.includes('building_number_is_missing')
                                    || ExtendableObject.addressStatus.includes('building_number_not_found')
                                    || (
                                        ExtendableObject.addressStatus.includes('address_minor_correction') &&
                                        (2 === ExtendableObject._addressCheckRequestIndex)
                                    )
                                )
                            ) {
                                // Popup needed.
                                var startingIndex = -1;
                                // Prepare main address.
                                var mainAddressHtml = $self.util.formatAddress(ExtendableObject._checkedAddress);
                                var firstPrediction = $self.util.formatAddress($self.addressPredictions[0]);
                                var mainAddressDiffHtml = '';

                                // Calculate main address diff.
                                diff = diffWords(mainAddressHtml, firstPrediction, {ignoreCase: false});
                                diff.forEach(function(part){
                                    var markClass = part.added ? 'endereco-span--add' :
                                        part.removed ? 'endereco-span--remove' : 'endereco-span--neutral';
                                    mainAddressDiffHtml += '<span class="' + markClass + '">' + part.value + '</span>';
                                });

                                // Prepare predictions.
                                var addressPredictions = [];
                                $self.addressPredictions.forEach(function(address) {
                                    var addressFormatted = $self.util.formatAddress(address);
                                    var addressDiff = '';
                                    var diff = diffWords(mainAddressHtml, addressFormatted, {ignoreCase: false});
                                    diff.forEach(function(part){
                                        var markClass = part.added ? 'endereco-span--add' :
                                            part.removed ? 'endereco-span--remove' : 'endereco-span--neutral';
                                        addressDiff += '<span class="' + markClass + '">' + part.value + '</span>';
                                    });
                                    addressPredictions.push({
                                        addressDiff: addressDiff
                                    });
                                });

                                // Render wrapper.
                                var indexCounter = 0;
                                var useButtonHTML = $self.config.templates.button.replace('{{{buttonClasses}}}', $self.config.templates.primaryButtonClasses);
                                var predictionsWrapperHtml = ExtendableObject.util.Mustache.render(
                                    $self.config.templates.addressPredictionsPopupWrapper.replace('{{{button}}}', useButtonHTML),
                                    {
                                        EnderecoAddressObject: $self,
                                        direction: getComputedStyle(document.querySelector('body')).direction,
                                        predictions: addressPredictions,
                                        mainAddress: mainAddressDiffHtml,
                                        showClose: ExtendableObject.config.ux.allowCloseModal,
                                        showConfirCheckbox: ExtendableObject.config.ux.confirmWithCheckbox,
                                        button: $self.config.templates.button,
                                        title: $self.config.texts.popupHeadlines[$self.addressType],
                                        index: function() {
                                            return indexCounter;
                                        },
                                        loopUp: function() {
                                            indexCounter++;
                                            return '';
                                        }
                                    }
                                );
                                document.querySelector('body').insertAdjacentHTML('beforeend', predictionsWrapperHtml);
                                document.querySelector('body').classList.add('endereco-no-scroll');

                                ExtendableObject.onAfterModalRendered.forEach( function(cb) {
                                    cb(ExtendableObject);
                                });

                                // Subscribe to events.
                                document.querySelectorAll('[endereco-modal-close]').forEach(function(DOMElement) {
                                    DOMElement.addEventListener('click', function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        $self.util.removePopup();
                                        window.EnderecoIntegrator.submitResume = undefined;
                                        window.EnderecoIntegrator.hasSubmit = false;
                                    })
                                });

                                document.querySelectorAll('[endereco-edit-address]').forEach(function(DOMElement) {
                                    DOMElement.addEventListener('click', function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        $self.waitUntilReady().then( function(){
                                            $self.onEditAddress.forEach(function(cb) {
                                                cb($self);
                                            });
                                            $self.waitUntilReady().then( function(){
                                                $self.util.removePopup();
                                            });
                                        }).catch();

                                        window.EnderecoIntegrator.submitResume = undefined;
                                        window.EnderecoIntegrator.hasSubmit = false;
                                    })
                                });

                                document.querySelectorAll('[endereco-use-selection]').forEach(function(DOMElement) {
                                    DOMElement.addEventListener('click', function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        $self.cb.copyAddressFromPrediction();
                                        $self.waitUntilReady().then( function(){
                                            $self.onAfterAddressCheckSelected.forEach(function(cb) {
                                                cb($self);
                                            });
                                            $self.waitUntilReady().then( function(){
                                                $self.util.removePopup();
                                            });
                                        }).catch();
                                        $self.waitForAllEnderecoPopupsToClose().then(function() {
                                            $self.waitUntilReady().then(function() {
                                                if (window.EnderecoIntegrator && window.EnderecoIntegrator.submitResume) {
                                                    ExtendableObject.beforeSubmitResume();
                                                    window.EnderecoIntegrator.submitResume();
                                                }
                                            }).catch(function() {
                                                if (window.EnderecoIntegrator && window.EnderecoIntegrator.submitResume) {
                                                    ExtendableObject.beforeSubmitResume();
                                                    window.EnderecoIntegrator.submitResume();
                                                }
                                            })
                                        }).catch()
                                    })
                                });

                                document.querySelectorAll('[name="endereco-address-predictions"]').forEach(function(DOMElement) {
                                    $self.addSubscriber(
                                        new EnderecoSubscriber(
                                            'addressPredictionsIndex',
                                            DOMElement,
                                            {
                                                syncValue: true
                                            }
                                        )
                                    );
                                });

                                if (ExtendableObject.config.ux.confirmWithCheckbox) {
                                    document.querySelectorAll('[endereco-confirm-address-checkbox]').forEach(function(DOMElement) {
                                        DOMElement.addEventListener('change', function(e) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            var $isChecked = e.target.checked;
                                            e.target.closest('.endereco-modal').querySelectorAll('[endereco-disabled-until-confirmed]').forEach( function(disableableDOM) {
                                                if ($isChecked || (0 <= ExtendableObject.addressPredictionsIndex)) {
                                                    disableableDOM.disabled = false;
                                                } else {
                                                    disableableDOM.disabled = true;
                                                }
                                            })
                                            // Find container
                                        });
                                        var $isChecked = DOMElement.checked;
                                        DOMElement.closest('.endereco-modal').querySelectorAll('[endereco-disabled-until-confirmed]').forEach( function(disableableDOM) {
                                            if ($isChecked || (0 <= ExtendableObject.addressPredictionsIndex)) {
                                                disableableDOM.disabled = false;
                                            } else {
                                                disableableDOM.disabled = true;
                                            }
                                        })
                                    });
                                }


                                document.querySelectorAll('[name="endereco-address-predictions"]').forEach(function(DOMElement) {
                                    DOMElement.addEventListener('change', function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        var $modal = e.target.closest('.endereco-modal');
                                        var $value = parseInt(e.target.value);

                                        if ((0 <= $value)) {
                                            $modal.querySelectorAll('[endereco-show-if-origin]').forEach( function(element) {
                                                element.style.display = 'none';
                                            });
                                        } else {
                                            $modal.querySelectorAll('[endereco-show-if-origin]').forEach( function(element) {
                                                element.style.display = 'block';
                                            });
                                        }
                                        if (ExtendableObject.config.ux.confirmWithCheckbox) {
                                            var $isChecked = $modal.querySelector('[endereco-confirm-address-checkbox]').checked;
                                            e.target.closest('.endereco-modal').querySelectorAll('[endereco-disabled-until-confirmed]').forEach( function(disableableDOM) {
                                                if ($isChecked || (0 <= $value)) {
                                                    disableableDOM.disabled = false;
                                                } else {
                                                    disableableDOM.disabled = true;
                                                }
                                            })
                                        }

                                        // Find container
                                    });

                                    if ((0 <= ExtendableObject.addressPredictionsIndex)) {
                                        DOMElement.closest('.endereco-modal').querySelectorAll('[endereco-show-if-origin]').forEach( function(element) {
                                            element.style.display = 'none';
                                        });
                                    } else {
                                        DOMElement.closest('.endereco-modal').querySelectorAll('[endereco-show-if-origin]').forEach( function(element) {
                                            element.style.display = 'block';
                                        });
                                    }

                                    if (ExtendableObject.config.ux.confirmWithCheckbox) {
                                        var $isChecked = DOMElement.closest('.endereco-modal').querySelector('[endereco-confirm-address-checkbox]').checked;
                                        DOMElement.closest('.endereco-modal').querySelectorAll('[endereco-disabled-until-confirmed]').forEach( function(disableableDOM) {
                                            if ($isChecked || (0 <= ExtendableObject.addressPredictionsIndex)) {
                                                disableableDOM.disabled = false;
                                            } else {
                                                disableableDOM.disabled = true;
                                            }
                                        })
                                    }
                                });

                                return;
                            }

                            // Render popup for address correction without predictions.
                            if (
                                ExtendableObject.addressStatus.includes('address_minor_correction') &&
                                (2 === ExtendableObject._addressCheckRequestIndex) &&
                                (0 < ExtendableObject.addressPredictions.length)
                            ) {
                                // No poup needed.
                                window.EnderecoIntegrator.popupQueue--;
                                window.EnderecoIntegrator.enderecoPopupQueue--;

                                ExtendableObject._awaits++;
                                var addressData = $self.addressPredictions[0];
                                addressData.countryCode = addressData.countryCode.toUpperCase();
                                $self.fieldNames.forEach( function(fieldName) {
                                    if ((undefined !== $self[fieldName])
                                      && (undefined !== addressData[fieldName])
                                      && ($self[fieldName] !== addressData[fieldName])
                                    ) {
                                        $self[fieldName] = addressData[fieldName];
                                    }
                                });

                                $self.addressStatus = ['address_correct', 'address_selected_automatically'];
                                $self.addressPredictions = [];
                                $self.waitUntilReady().then( function() {
                                    $self.onAfterAddressCheckSelected.forEach(function(cb) {
                                        cb($self);
                                    });
                                }).catch();
                                ExtendableObject._awaits--;
                                return;
                            }

                            // Render popup for address correction without predictions.
                            if (
                                ExtendableObject.addressStatus.includes('address_needs_correction') &&
                                (
                                    ExtendableObject.addressStatus.includes('building_number_is_missing')
                                    || ExtendableObject.addressStatus.includes('building_number_not_found')
                                    || (0 === ExtendableObject.addressPredictions.length)
                                )
                            ) {
                                // Prepare main address.
                                // TODO: replace button then replace button classes.
                                var mainAddressHtml = $self.util.formatAddress(ExtendableObject._checkedAddress, true, true);
                                var editButtonHTML = $self.config.templates.buttonEditAddress.replace('{{{buttonClasses}}}', $self.config.templates.primaryButtonClasses);
                                var confirmButtonHTML = $self.config.templates.buttonConfirmAddress.replace('{{{buttonClasses}}}', $self.config.templates.secondaryButtonClasses);
                                var errors = [];

                                if (ExtendableObject.addressStatus.includes('building_number_is_missing')) {
                                    if (!!window.EnderecoIntegrator.config.texts.statuses.building_number_is_missing) {
                                        errors.push(window.EnderecoIntegrator.config.texts.statuses.building_number_is_missing)
                                    } else {
                                        errors.push('Hausnummer fehlt.')
                                    }
                                }

                                if (ExtendableObject.addressStatus.includes('building_number_not_found')) {
                                    if (!!window.EnderecoIntegrator.config.texts.statuses.building_number_not_found) {
                                        errors.push(window.EnderecoIntegrator.config.texts.statuses.building_number_not_found)
                                    } else {
                                        errors.push('Hausnummer konnte nicht verifiziert werden. Prüfen Sie die Schreibweise und ob sie im richtigen Feld eingetragen ist.')
                                    }
                                    errors.push();
                                }

                                if (ExtendableObject.addressStatus.includes('street_name_needs_correction')) {
                                    if (!!window.EnderecoIntegrator.config.texts.statuses.street_name_needs_correction) {
                                        errors.push(window.EnderecoIntegrator.config.texts.statuses.street_name_needs_correction)
                                    } else {
                                        errors.push('Schreibfehler bei der Stra&szlig;e. Nutzen Sie bitte die amtliche Schreibweise.')
                                    }
                                }

                                if (ExtendableObject.addressStatus.includes('locality_needs_correction')) {
                                    if (!!window.EnderecoIntegrator.config.texts.statuses.locality_needs_correction) {
                                        errors.push(window.EnderecoIntegrator.config.texts.statuses.locality_needs_correction)
                                    } else {
                                        errors.push('Schreibfehler bei dem Ort. Nutzen Sie bitte die amtliche Schreibweise.')
                                    }
                                }

                                if (ExtendableObject.addressStatus.includes('postal_code_needs_correction')) {
                                    if (!!window.EnderecoIntegrator.config.texts.statuses.postal_code_needs_correction) {
                                        errors.push(window.EnderecoIntegrator.config.texts.statuses.postal_code_needs_correction)
                                    } else {
                                        errors.push('Schreibfehler bei der Postleitzahl. Achten Sie auf Vertipper.')
                                    }
                                }

                                if (ExtendableObject.addressStatus.includes('country_code_needs_correction')) {
                                    if (!!window.EnderecoIntegrator.config.texts.statuses.country_code_needs_correction) {
                                        errors.push(window.EnderecoIntegrator.config.texts.statuses.country_code_needs_correction)
                                    } else {
                                        errors.push('Falsches Land. Wählen Sie bitte das richtige Land aus.');
                                    }
                                }

                                var modalHTML = ExtendableObject.util.Mustache.render(
                                    $self.config.templates.addressNoPredictionWrapper
                                        .replace('{{{button}}}', editButtonHTML)
                                        .replace('{{{buttonSecondary}}}', confirmButtonHTML)
                                    ,
                                    {
                                        EnderecoAddressObject: $self,
                                        direction: getComputedStyle(document.querySelector('body')).direction,
                                        modalClasses: ExtendableObject.addressStatus.join(' '),
                                        showClose: ExtendableObject.config.ux.allowCloseModal,
                                        hasErrors: 0 < errors.length,
                                        errors: errors,
                                        showConfirCheckbox: ExtendableObject.config.ux.confirmWithCheckbox,
                                        mainAddress: mainAddressHtml,
                                        button: $self.config.templates.button,
                                        title: $self.config.texts.popupHeadlines[$self.addressType]
                                    }
                                );
                                document.querySelector('body').insertAdjacentHTML('beforeend', modalHTML);
                                document.querySelector('body').classList.add('endereco-no-scroll');

                                ExtendableObject.onAfterModalRendered.forEach( function(cb) {
                                    cb(ExtendableObject);
                                });

                                // Subscribe to events.
                                document.querySelectorAll('[endereco-modal-close]').forEach(function(DOMElement) {
                                    DOMElement.addEventListener('click', function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        $self.util.removePopup();
                                        window.EnderecoIntegrator.submitResume = undefined;
                                        window.EnderecoIntegrator.hasSubmit = false;
                                    })
                                });

                                document.querySelectorAll('[endereco-edit-address]').forEach(function(DOMElement) {
                                    DOMElement.addEventListener('click', function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.EnderecoIntegrator.submitResume = undefined;
                                        window.EnderecoIntegrator.hasSubmit = false;
                                        $self.waitUntilReady().then( function(){
                                            $self.onEditAddress.forEach(function(cb) {
                                                cb($self);
                                            });
                                            $self.waitUntilReady().then( function(){
                                                $self.util.removePopup();
                                            });
                                        }).catch();
                                    })
                                });

                                document.querySelectorAll('[endereco-confirm-address]').forEach(function(DOMElement) {
                                    DOMElement.addEventListener('click', function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        var statusTemp = JSON.parse(JSON.stringify(ExtendableObject.addressStatus));
                                        statusTemp.push('address_selected_by_customer')
                                        ExtendableObject.addressStatus = statusTemp;
                                        $self.waitUntilReady().then( function(){
                                            $self.onConfirmAddress.forEach(function(cb) {
                                                cb($self);
                                            });
                                            $self.waitUntilReady().then( function(){
                                                $self.util.removePopup();
                                            });
                                        }).catch();
                                        $self.waitForAllEnderecoPopupsToClose().then(function() {
                                            $self.waitUntilReady().then(function() {
                                                if (window.EnderecoIntegrator && window.EnderecoIntegrator.submitResume) {
                                                    ExtendableObject.beforeSubmitResume();
                                                    window.EnderecoIntegrator.submitResume();
                                                }
                                            }).catch(function() {
                                                if (window.EnderecoIntegrator && window.EnderecoIntegrator.submitResume) {
                                                    ExtendableObject.beforeSubmitResume();
                                                    window.EnderecoIntegrator.submitResume();
                                                }
                                            })
                                        }).catch()
                                    })
                                });

                                if (ExtendableObject.config.ux.confirmWithCheckbox) {
                                    document.querySelectorAll('[endereco-confirm-address-checkbox]').forEach(function(DOMElement) {
                                        DOMElement.addEventListener('change', function(e) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            var $isChecked = e.target.checked;
                                            e.target.closest('.endereco-modal').querySelectorAll('[endereco-disabled-until-confirmed]').forEach( function(disableableDOM) {
                                                if ($isChecked) {
                                                    disableableDOM.disabled = false;
                                                } else {
                                                    disableableDOM.disabled = true;
                                                }
                                            })
                                            // Find container
                                        });
                                        var $isChecked = DOMElement.checked;
                                        DOMElement.closest('.endereco-modal').querySelectorAll('[endereco-disabled-until-confirmed]').forEach( function(disableableDOM) {
                                            if ($isChecked) {
                                                disableableDOM.disabled = false;
                                            } else {
                                                disableableDOM.disabled = true;
                                            }
                                        })
                                    });
                                }

                                return;
                            }

                            // Render popup for not found address.
                            if (
                                ExtendableObject.addressStatus.includes('address_not_found') &&
                                (0 === ExtendableObject.addressPredictions.length)
                            ) {
                                // Prepare main address.
                                // TODO: replace button then replace button classes.
                                var mainAddressHtml = $self.util.formatAddress(ExtendableObject._checkedAddress, true);
                                var editButtonHTML = $self.config.templates.buttonEditAddress.replace('{{{buttonClasses}}}', $self.config.templates.primaryButtonClasses);
                                var confirmButtonHTML = $self.config.templates.buttonConfirmAddress.replace('{{{buttonClasses}}}', $self.config.templates.secondaryButtonClasses);
                                var modalHTML = ExtendableObject.util.Mustache.render(
                                    $self.config.templates.addressNotFoundPopupWrapper
                                        .replace('{{{button}}}', editButtonHTML)
                                        .replace('{{{buttonSecondary}}}', confirmButtonHTML)
                                    ,
                                    {
                                        EnderecoAddressObject: $self,
                                        direction: getComputedStyle(document.querySelector('body')).direction,
                                        mainAddress: mainAddressHtml,
                                        showClose: ExtendableObject.config.ux.allowCloseModal,
                                        showConfirCheckbox: ExtendableObject.config.ux.confirmWithCheckbox,
                                        button: $self.config.templates.button,
                                        title: $self.config.texts.popupHeadlines[$self.addressType]
                                    }
                                );
                                document.querySelector('body').insertAdjacentHTML('beforeend', modalHTML);
                                document.querySelector('body').classList.add('endereco-no-scroll');

                                ExtendableObject.onAfterModalRendered.forEach( function(cb) {
                                    cb(ExtendableObject);
                                });

                                // Subscribe to events.
                                document.querySelectorAll('[endereco-modal-close]').forEach(function(DOMElement) {
                                    DOMElement.addEventListener('click', function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        $self.util.removePopup();
                                        window.EnderecoIntegrator.submitResume = undefined;
                                        window.EnderecoIntegrator.hasSubmit = false;
                                    })
                                });

                                document.querySelectorAll('[endereco-edit-address]').forEach(function(DOMElement) {
                                    DOMElement.addEventListener('click', function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        window.EnderecoIntegrator.submitResume = undefined;
                                        window.EnderecoIntegrator.hasSubmit = false;
                                        $self.waitUntilReady().then( function(){
                                            $self.onEditAddress.forEach(function(cb) {
                                                cb($self);
                                            });
                                            $self.waitUntilReady().then( function(){
                                                $self.util.removePopup();
                                            });
                                        }).catch();
                                    })
                                });

                                document.querySelectorAll('[endereco-confirm-address]').forEach(function(DOMElement) {
                                    DOMElement.addEventListener('click', function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        ExtendableObject.addressStatus = ['address_not_found','address_selected_by_customer'];
                                        $self.waitUntilReady().then( function(){
                                            $self.onConfirmAddress.forEach(function(cb) {
                                                cb($self);
                                            });
                                            $self.waitUntilReady().then( function(){
                                                $self.util.removePopup();
                                            });
                                        }).catch();
                                        $self.waitForAllEnderecoPopupsToClose().then(function() {
                                            $self.waitUntilReady().then(function() {
                                                if (window.EnderecoIntegrator && window.EnderecoIntegrator.submitResume) {
                                                    ExtendableObject.beforeSubmitResume();
                                                    window.EnderecoIntegrator.submitResume();
                                                }
                                            }).catch(function() {
                                                if (window.EnderecoIntegrator && window.EnderecoIntegrator.submitResume) {
                                                    ExtendableObject.beforeSubmitResume();
                                                    window.EnderecoIntegrator.submitResume();
                                                }
                                            })
                                        }).catch()
                                    })
                                });

                                if (ExtendableObject.config.ux.confirmWithCheckbox) {
                                    document.querySelectorAll('[endereco-confirm-address-checkbox]').forEach(function(DOMElement) {
                                        DOMElement.addEventListener('change', function(e) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            var $isChecked = e.target.checked;
                                            e.target.closest('.endereco-modal').querySelectorAll('[endereco-disabled-until-confirmed]').forEach( function(disableableDOM) {
                                                if ($isChecked) {
                                                    disableableDOM.disabled = false;
                                                } else {
                                                    disableableDOM.disabled = true;
                                                }
                                            })
                                            // Find container
                                        });
                                        var $isChecked = DOMElement.checked;
                                        DOMElement.closest('.endereco-modal').querySelectorAll('[endereco-disabled-until-confirmed]').forEach( function(disableableDOM) {
                                            if ($isChecked) {
                                                disableableDOM.disabled = false;
                                            } else {
                                                disableableDOM.disabled = true;
                                            }
                                        })
                                    });
                                }
                                return;
                            }
                        }).catch();
                    }).catch();
                };

                ExtendableObject.util.removePopup = function() {
                    if (document.querySelector('[endereco-popup]')) {
                        document.querySelector('[endereco-popup]').parentNode.removeChild(document.querySelector('[endereco-popup]'));
                        document.querySelector('body').classList.remove('endereco-no-scroll');
                        ExtendableObject.addressPredictionsIndex = 0;
                        window.EnderecoIntegrator.popupQueue--;
                        window.EnderecoIntegrator.enderecoPopupQueue--;

                        if (!!ExtendableObject.modalClosed) {
                            ExtendableObject.modalClosed();
                        }
                    }
                };

                ExtendableObject.util.calculateDependingStatuses = function() {
                    var value = ExtendableObject.addressStatus;
                    // Calculate detailed codes for fieldnames.
                    if (ExtendableObject.hasLoadedExtension('CountryCodeCheckExtension')) {
                        var countryCodeStatus = [];
                        if (value.includes('address_correct') && ExtendableObject.countryCode) {
                            countryCodeStatus.push('country_code_correct');
                        }
                        if (value.includes('address_needs_correction') && ExtendableObject.countryCode) {
                            if (value.includes('country_code_correct')) {
                                countryCodeStatus.push('country_code_correct');
                            } else if (value.includes('country_code_needs_correction')) {
                                countryCodeStatus.push('country_code_needs_correction');
                            } else if (0 < ExtendableObject.addressPredictions.length && ExtendableObject.addressPredictions[0].countryCode.toUpperCase() !== ExtendableObject.countryCode.toUpperCase()) {
                                countryCodeStatus.push('country_code_needs_correction');
                            } else {
                                countryCodeStatus.push('country_code_correct');
                            }
                        }
                        if (value.includes('address_multiple_variants') && ExtendableObject.countryCode) {
                            countryCodeStatus.push('address_multiple_variants');
                        }
                        if (value.includes('address_not_found') && ExtendableObject.countryCode) {
                            countryCodeStatus.push('address_not_found');
                        }
                        ExtendableObject.waitForActive().then(function() {
                            ExtendableObject.countryCodeStatus = countryCodeStatus;
                        }).catch()

                    }
                    if (ExtendableObject.hasLoadedExtension('SubdivisionCodeExtension')) {
                        var subdivisionCodes = [];
                        let subdivisionRelevant = false;
                        if ((0 < ExtendableObject._subscribers.subdivisionCode.length)) {
                            ExtendableObject._subscribers.subdivisionCode.forEach( function(listener) {
                                if (!listener.object.disabled
                                    && listener.object.isConnected) {
                                    subdivisionRelevant = true;
                                }
                            });
                        }

                        if (subdivisionRelevant) {
                            if (value.includes('subdivision_code_correct') || value.includes('address_correct')) {
                                subdivisionCodes.push('subdivision_code_correct');
                            } else if (value.includes('subdivision_code_needs_correction')) {
                                subdivisionCodes.push('subdivision_code_needs_correction');
                            } else if (value.includes('address_not_found')) {
                                subdivisionCodes.push('address_not_found');
                            } else if (value.includes('address_multiple_variants')) {
                                subdivisionCodes.push('address_multiple_variants');
                            } else {
                                subdivisionCodes = [];
                            }
                            ExtendableObject.waitForActive().then(function() {
                                ExtendableObject.subdivisionCodeStatus = subdivisionCodes;
                            }).catch()
                        }
                    }
                    if (ExtendableObject.hasLoadedExtension('PostalCodeExtension')) {
                        var postalCodeStatus = [];
                        if (value.includes('postal_code_correct') || value.includes('address_correct')) {
                            postalCodeStatus.push('postal_code_correct');
                        }
                        if (value.includes('postal_code_needs_correction')) {
                            postalCodeStatus.push('postal_code_needs_correction');
                        }
                        if (value.includes('address_multiple_variants')) {
                            postalCodeStatus.push('address_multiple_variants');
                        }
                        if (value.includes('address_not_found')) {
                            postalCodeStatus.push('address_not_found');
                        }
                        ExtendableObject.waitForActive().then(function() {
                            ExtendableObject.postalCodeStatus = postalCodeStatus;
                        }).catch()

                    }
                    if (ExtendableObject.hasLoadedExtension('LocalityExtension')) {
                        var localityStatus = [];
                        if (value.includes('locality_correct') || value.includes('address_correct')) {
                            localityStatus.push('locality_correct');
                        }
                        if (value.includes('locality_needs_correction')) {
                            localityStatus.push('locality_needs_correction');
                        }
                        if (value.includes('address_multiple_variants')) {
                            localityStatus.push('address_multiple_variants');
                        }
                        if (value.includes('address_not_found')) {
                            localityStatus.push('address_not_found');
                        }
                        ExtendableObject.waitForActive().then(function() {
                            ExtendableObject.localityStatus = localityStatus;
                        }).catch()

                    }
                    if (ExtendableObject.hasLoadedExtension('StreetNameExtension')) {
                        var streetNameStatus = [];
                        if (value.includes('street_name_correct') || value.includes('address_correct')) {
                            streetNameStatus.push('street_name_correct');
                        }
                        if (value.includes('street_name_needs_correction')) {
                            streetNameStatus.push('street_name_needs_correction');
                        }
                        if (value.includes('address_multiple_variants')) {
                            streetNameStatus.push('address_multiple_variants');
                        }
                        if (value.includes('address_not_found')) {
                            streetNameStatus.push('address_not_found');
                        }
                        ExtendableObject.waitForActive().then(function() {
                            ExtendableObject.streetNameStatus = streetNameStatus;
                        }).catch()

                    }
                    if (ExtendableObject.hasLoadedExtension('StreetFullExtension')) {
                        var streetFullStatus = [];
                        if (value.includes('street_full_correct') || value.includes('address_correct')) {
                            streetFullStatus.push('street_full_correct');
                        }
                        if (value.includes('address_needs_correction')) {
                            if (value.includes('street_name_needs_correction') || value.includes('building_number_needs_correction')) {
                                streetFullStatus.push('street_full_needs_correction');
                            } else {
                                streetFullStatus.push('street_full_correct');
                            }
                        }
                        if (value.includes('address_multiple_variants')) {
                            streetFullStatus.push('address_multiple_variants');
                        }
                        if (value.includes('address_not_found')) {
                            streetFullStatus.push('address_not_found');
                        }
                        ExtendableObject.waitForActive().then(function() {
                            ExtendableObject.streetFullStatus = streetFullStatus;
                        }).catch()

                    }
                    if (ExtendableObject.hasLoadedExtension('BuildingNumberExtension')) {
                        var buildingNumberStatus = [];
                        if (value.includes('building_number_correct') || value.includes('address_correct')) {
                            buildingNumberStatus.push('building_number_correct');
                        }
                        if (value.includes('building_number_needs_correction')) {
                            buildingNumberStatus.push('building_number_needs_correction');
                        }
                        if (value.includes('building_number_not_found')) {
                            buildingNumberStatus.push('building_number_not_found');
                        }
                        if (value.includes('building_number_missing')) {
                            buildingNumberStatus.push('building_number_missing');
                        }
                        if (value.includes('address_multiple_variants')) {
                            buildingNumberStatus.push('address_multiple_variants');
                        }
                        if (value.includes('address_not_found')) {
                            buildingNumberStatus.push('address_not_found');
                        }
                        ExtendableObject.waitForActive().then(function() {
                            ExtendableObject.buildingNumberStatus = buildingNumberStatus;
                        }).catch()

                    }
                    if (ExtendableObject.hasLoadedExtension('AdditionalInfoExtension')) {
                        var additionalInfoStatus = [];
                        if (value.includes('address_correct') && ExtendableObject.additionalInfo) {
                            additionalInfoStatus.push('additional_info_correct');
                        }
                        if (value.includes('address_needs_correction') && ExtendableObject.additionalInfo) {
                            if (0 < ExtendableObject.addressPredictions.length && ExtendableObject.addressPredictions[0].additionalInfo !== ExtendableObject.additionalInfo) {
                                additionalInfoStatus.push('additional_info_needs_correction');
                            } else {
                                additionalInfoStatus.push('additional_info_correct');
                            }
                        }
                        if (value.includes('address_multiple_variants') && ExtendableObject.additionalInfo) {
                            additionalInfoStatus.push('address_multiple_variants');
                        }
                        if (value.includes('address_not_found') && ExtendableObject.additionalInfo) {
                            additionalInfoStatus.push('address_not_found');
                        }
                        ExtendableObject.waitForActive().then(function() {
                            ExtendableObject.additionalInfoStatus = additionalInfoStatus;
                        }).catch()

                    }
                };

                // Add change event hadler.
                ExtendableObject.cb.addressStatusChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.addressStatus = subscriber.value;
                    }
                };

                ExtendableObject.cb.addressPredictionsIndexChange = function(subscriber) {
                    return function(e) {
                        ExtendableObject.addressPredictionsIndex = subscriber.value;
                    }
                };

                ExtendableObject.cb.copyAddressFromPrediction = function(index=null) {
                    ExtendableObject._awaits++;
                    var $self = ExtendableObject;
                    if (null === index) {
                        index = $self.addressPredictionsIndex;
                    }
                    if (-1 === parseInt(index)) {
                        if (!$self.addressStatus.includes('address_selected_by_customer')) {
                            var temp = $self.addressStatus.slice();
                            if (!$self.addressStatus.includes('address_selected_by_customer')) {
                                temp.push('address_selected_by_customer');
                                $self.addressStatus = temp;
                            }
                        }
                        ExtendableObject._awaits--;
                        return; // Dont copy, -1 is current values.
                    }
                    var addressData = $self.addressPredictions[index];
                    addressData.countryCode = addressData.countryCode.toUpperCase();
                    $self.fieldNames.forEach( function(fieldName) {
                        if ((undefined !== $self[fieldName])
                          && (undefined !== addressData[fieldName])
                          && ($self[fieldName] !== addressData[fieldName])
                        ) {
                            $self[fieldName] = addressData[fieldName];
                        }
                    });

                    $self.addressStatus = ['address_correct', 'address_selected_by_customer'];
                    ExtendableObject._awaits--;
                };

                // Add the "addressStatus" property
                Object.defineProperty(ExtendableObject, 'addressStatus', {
                    get: function() {
                        return this._addressStatus;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._addressStatus;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = [];

                            if (!Array.isArray(value)) {
                                value = value.split(',');
                            }

                            // Transform statuscodes.
                            if (value.includes('A1000') && !value.includes('A1100')) {
                                if (!value.includes('address_correct')) {
                                    value.push('address_correct');
                                }
                            }
                            if (value.includes('A1000') && value.includes('A1100')) {
                                if (!value.includes('address_needs_correction')) {
                                    value.push('address_needs_correction');
                                }
                            }
                            if (value.includes('A2000')) {
                                if (!value.includes('address_multiple_variants')) {
                                    value.push('address_multiple_variants');
                                }
                            }
                            if (value.includes('A3000')) {
                                if (!value.includes('address_not_found')) {
                                    value.push('address_not_found');
                                }
                            }

                            if (0 === value.length) {
                                value = ['address_not_checked'];
                            }

                            if (!ExtendableObject.util.isEqual(oldValue, value)) {
                                ExtendableObject._addressStatus = value;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.addressStatus.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'addressStatus',
                                                oldValue: oldValue,
                                                newValue: value,
                                                object: ExtendableObject
                                            }
                                        }
                                    )
                                );

                                ExtendableObject.waitUntilReady().then(function() {
                                    ExtendableObject.util.calculateDependingStatuses();
                                }).catch();
                            }
                        }).catch().finally(function() {
                            ExtendableObject._awaits--;
                        });

                    }
                });

                // Add getter and setter for fields.
                Object.defineProperty(ExtendableObject, 'addressPredictions', {
                    get: function() {
                        return ExtendableObject._addressPredictions;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._addressPredictions;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = value;

                            if (!ExtendableObject.util.isEqual(oldValue, newValue)) {
                                ExtendableObject._addressPredictions = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.addressPredictions.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'addressPredictions',
                                                oldValue: oldValue,
                                                newValue: newValue,
                                                object: ExtendableObject
                                            }
                                        }
                                    )
                                );
                            }
                        }).catch().finally(function() {
                            ExtendableObject._awaits--;
                        });
                    }
                });

                Object.defineProperty(ExtendableObject, 'addressType', {
                    get: function() {
                        return this._addressType;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._addressType;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            if (!ExtendableObject.util.isEqual(oldValue, value)) {
                                ExtendableObject._addressType = value;
                                ExtendableObject._changed = false;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.addressType.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'addressType',
                                                oldValue: oldValue,
                                                newValue: value,
                                                object: ExtendableObject
                                            }
                                        }
                                    )
                                );

                                ExtendableObject.addressPredictions = [];
                                ExtendableObject.addressStatus = [];
                            }
                        }).catch().finally(function() {
                            ExtendableObject._awaits--;
                        });

                    }
                });

                // Add getter and setter for fields.
                Object.defineProperty(ExtendableObject, 'addressTimestamp', {
                    get: function() {
                        return ExtendableObject._addressTimestamp;
                    },
                    set: function(value) {
                        var oldValue = ExtendableObject._addressTimestamp;
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = value;

                            if (!ExtendableObject.util.isEqual(oldValue, newValue)) {
                                ExtendableObject._addressTimestamp = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.addressTimestamp.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'addressTimestamp',
                                                oldValue: oldValue,
                                                newValue: newValue,
                                                object: ExtendableObject
                                            }
                                        }
                                    )
                                );
                            }
                        }).catch().finally(function() {
                            ExtendableObject._awaits--;
                        });
                    }
                });

                // Add getter and setter for fields.
                Object.defineProperty(ExtendableObject, 'addressPredictionsIndex', {
                    get: function() {
                        return this._addressPredictionsIndex;
                    },
                    set: function(value) {
                        ExtendableObject._awaits++;
                        var oldValue = ExtendableObject._addressPredictionsIndex;

                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            var newValue = parseInt(value);

                            if (!ExtendableObject.util.isEqual(oldValue, newValue)) {
                                ExtendableObject._addressPredictionsIndex = newValue;

                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.addressPredictionsIndex.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                ExtendableObject.fire(
                                    new ExtendableObject.util.CustomEvent(
                                        'change',
                                        {
                                            detail: {
                                                fieldName: 'addressPredictionsIndex',
                                                oldValue: oldValue,
                                                newValue: newValue,
                                                object: ExtendableObject
                                            }
                                        }
                                    )
                                );
                            }
                        }).catch().finally(function() {
                            ExtendableObject._awaits--;
                        });
                    }
                });

                ExtendableObject.util.checkAddress = function(address = null, render = true) {
                    if (!address) {
                        address = ExtendableObject.address;
                    }

                    ExtendableObject._addressIsBeingChecked = true;

                    return new ExtendableObject.util.Promise(function(resolve, reject) {

                        ExtendableObject.waitUntilReady().then(function() {
                            ExtendableObject._addressCheckRequestIndex++;
                            var addressCheckRequestIndex = ExtendableObject._addressCheckRequestIndex * 1;

                            ExtendableObject._checkedAddress = JSON.parse(
                                JSON.stringify(ExtendableObject.address)
                            );

                            var message = {
                                'jsonrpc': '2.0',
                                'id': ExtendableObject._addressCheckRequestIndex,
                                'method': 'addressCheck',
                                'params': {
                                    'country': address.countryCode,
                                    'language': ExtendableObject.config.lang,
                                    'postCode': address.postalCode,
                                    'cityName': address.locality
                                }
                            };

                            // Check if streetName is set and has a value
                            if (address.streetName && address.streetName.trim() !== '') {
                                // Add streetName and buildingNumber to message.params
                                message.params.street = address.streetName;
                                message.params.houseNumber = address.buildingNumber;
                            } else {
                                // If streetName is not set or is empty, use streetFull instead
                                message.params.streetFull = address.streetFull;
                            }

                            if ((0 < ExtendableObject._subscribers.subdivisionCode.length)) {
                                ExtendableObject._subscribers.subdivisionCode.forEach( function(listener) {
                                    if (!listener.object.disabled
                                        && listener.object.isConnected) {
                                        message.params.subdivisionCode = address.subdivisionCode;
                                    }
                                });
                            }

                            if ((0 < ExtendableObject._subscribers.additionalInfo.length)) {
                                ExtendableObject._subscribers.additionalInfo.forEach( function(listener) {
                                    if (!listener.object.disabled
                                        && listener.object.isConnected) {
                                        message.params.additionalInfo = address.additionalInfo;
                                    }
                                });
                            }

                            ExtendableObject._awaits++;
                            ExtendableObject.util.axios.post(ExtendableObject.config.apiUrl, message, {
                                timeout: ExtendableObject.config.ux.requestTimeout,
                                headers: {
                                    'X-Auth-Key': ExtendableObject.config.apiKey,
                                    'X-Agent': ExtendableObject.config.agentName,
                                    'X-Remote-Api-Url': ExtendableObject.config.remoteApiUrl,
                                    'X-Transaction-Referer': window.location.href,
                                    'X-Transaction-Id': (ExtendableObject.hasLoadedExtension('SessionExtension'))?ExtendableObject.sessionId:'not_required'
                                }
                            }).then(function(response) {
                                var tempAddressContainer;
                                if (undefined !== response.data.result && undefined !== response.data.result.predictions) {
                                    var copyOfPredictions = [];
                                    var addressCounter = 0;

                                    if (addressCheckRequestIndex !== ExtendableObject._addressCheckRequestIndex) {
                                        return;
                                    }

                                    if (ExtendableObject.anyMissing()) {
                                        return;
                                    }

                                    if (ExtendableObject.areEssentialsDisabled()) {
                                        return;
                                    }

                                    let isStillRelevant = true;
                                    window.EnderecoIntegrator.amsFilters.isAddressMetaStillRelevant.some(function(callback) {
                                        isStillRelevant = callback(isStillRelevant, ExtendableObject);
                                        return !isStillRelevant; // If isStillRelevant is false, some() will stop iterating.
                                    });

                                    if (!isStillRelevant) {
                                        return;
                                    }

                                    // If session counter is set, increase it.
                                    if (ExtendableObject.hasLoadedExtension('SessionExtension')) {
                                        ExtendableObject.sessionCounter++;
                                    }

                                    ExtendableObject.addressTimestamp = Math.floor(Date.now() / 1000);

                                    response.data.result.predictions.forEach( function(address) {

                                        if (addressCounter >= ExtendableObject.config.ux.maxAddressPredictionItems) {
                                            return false;
                                        }
                                        addressCounter++;

                                        tempAddressContainer = {
                                            countryCode: (address.country)?address.country: ExtendableObject._countryCode,
                                            postalCode: address.postCode,
                                            locality: address.cityName,
                                            streetName: address.street,
                                            buildingNumber: address.houseNumber
                                        }

                                        if (address.hasOwnProperty('subdivisionCode')) {
                                            tempAddressContainer.subdivisionCode = address.subdivisionCode;
                                        }

                                        if (address.hasOwnProperty('additionalInfo')) {
                                            tempAddressContainer.additionalInfo = address.additionalInfo;
                                        }

                                        // Filter out identical copy.
                                        if (copyOfPredictions.includes(tempAddressContainer)) {
                                            return false;
                                        }

                                        copyOfPredictions.push(tempAddressContainer);
                                    });

                                    ExtendableObject.addressStatus = response.data.result.status;
                                    ExtendableObject.addressPredictions = copyOfPredictions;

                                    // If specific status - render popup.
                                    if (render) {
                                        ExtendableObject.util.renderAddressPredictionsPopup();
                                    }

                                    resolve();
                                }
                                // Check for the old session id and regenerate if necessary.
                                else if (response.data.error?.code === -32700 && ExtendableObject.util.updateSessionId) {
                                    ExtendableObject.util.updateSessionId();
                                    reject(response);
                                }
                                else {
                                    reject(response);
                                }
                            }).catch(function(e) {
                                reject(e.response);
                            }).finally(function() {
                                ExtendableObject._awaits--;
                                ExtendableObject._changed = false;
                                ExtendableObject._addressIsBeingChecked = false;
                                ExtendableObject.submitUnblocked();
                            });
                        }).catch( function(e) {
                            console.log(e);
                        });
                    })
                }

                if (ExtendableObject.config.showDebugInfo) {
                    console.log('AddressCheckExtension applied');
                }

                ExtendableObject.states.AddressCheckExtension = {
                    active: true
                }

                resolve($self);
            }).catch(function() {
                console.log('Failed to load because of timeout');
                reject($self);
            })

        });
    }
}

export default AddressCheckExtension

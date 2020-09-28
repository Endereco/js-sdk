import {diffWords} from "diff";
import addressFullTemplates from "../../../templates/addressFullTemplates";
import addressPredictionsPopupWrapper from "../../../templates/address_check_wrapper_template.html";
import EnderecoSubscriber from './../../subscriber.js';

var AddressCheckExtension = {
    name: 'AddressCheckExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('AddressExtension').then(function() {
                // Add email field.
                ExtendableObject._addressStatus = [];
                ExtendableObject._subscribers.addressStatus = [];
                ExtendableObject._addressPredictions = [];
                ExtendableObject._subscribers.addressPredictions = [];
                ExtendableObject._addressPredictionsIndex = 0;
                ExtendableObject._subscribers.addressPredictionsIndex = [];
                ExtendableObject._addressTimestamp = [];
                ExtendableObject._subscribers.addressTimestamp = [];

                // Callback collectors.
                ExtendableObject.onAfterAddressCheckNoAction = [];
                ExtendableObject.onAfterAddressCheck = [];
                ExtendableObject.onAfterAddressCheckSelected = [];

                ExtendableObject.config.templates.addressFull = addressFullTemplates;
                ExtendableObject.config.templates.addressPredictionsPopupWrapper = addressPredictionsPopupWrapper;

                if (!ExtendableObject.config.templates.button) {
                    ExtendableObject.config.templates.button = '<button class="endereco-button endereco-button-primary endereco-button-default" endereco-use-selection>{{{EnderecoAddressObject.config.texts.useSelected}}}</button>';
                }

                ExtendableObject.onBlurTimeout = null;

                ExtendableObject.waitForPopupAreaToBeFree = function() {
                    return new ExtendableObject.util.Promise(function(resolve, reject) {
                        var waitForFreePlace = setInterval(function() {
                            if(!document.querySelector('[endereco-popup]')) {
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

                ExtendableObject.util.formatAddress = function(address=null) {
                    var $self = ExtendableObject;
                    var useTemplate = 'default';
                    var formattedAddress = '';

                    if (!address) {
                        address = ExtendableObject.address;
                    }

                    // Format current address.
                    if (undefined !== $self.config.templates.addressFull[$self.countryCode]) {
                        useTemplate = $self.countryCode;
                    }
                    formattedAddress = ExtendableObject.util.Mustache.render(
                        $self.config.templates.addressFull[useTemplate],
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
                    }
                    window.EnderecoIntegrator.popupQueue++;

                    ExtendableObject.waitUntilReady().then( function() {
                        var $self = ExtendableObject;

                        $self.waitForPopupAreaToBeFree().then(function() {
                            var diff = [];

                            // Check if the popup need to be rendered.
                            if (
                                ExtendableObject.addressStatus.includes('address_correct') ||
                                ExtendableObject.addressStatus.includes('address_not_found')
                            ) {
                                // No poup needed.
                                window.EnderecoIntegrator.popupQueue--;

                                ExtendableObject.onAfterAddressCheckNoAction.forEach( function(cb) {
                                    cb(ExtendableObject);
                                });

                                ExtendableObject.onAfterAddressCheck.forEach( function(cb) {
                                    cb(ExtendableObject);
                                });

                                // Call global submit resume function.
                                ExtendableObject.waitForAllPopupsToClose().then(function() {
                                    if (window.EnderecoIntegrator && window.EnderecoIntegrator.submitResume) {
                                        window.EnderecoIntegrator.submitResume();
                                    }
                                }).catch()
                            } else if (
                                (ExtendableObject.addressStatus.includes('address_needs_correction') ||
                                ExtendableObject.addressStatus.includes('address_multiple_variants')) &&
                                0 < ExtendableObject.addressPredictions.length
                            ) {
                                // Popup needed.
                                var startingIndex = -1;
                                // Prepare main address.
                                var mainAddressHtml = $self.util.formatAddress($self.address);
                                var firstPrediction = $self.util.formatAddress($self.addressPredictions[0]);
                                var mainAddressDiffHtml = '';

                                // Calculate main address diff.
                                diff = diffWords(mainAddressHtml, firstPrediction, {ignoreCase: false});
                                diff.forEach(function(part){
                                    var markClass = part.added ? 'endereco-span--add' :
                                        part.removed ? 'endereco-span--remove' : 'endereco-span--neutral';
                                    mainAddressDiffHtml += '<span class="' + markClass + '">' + part.value.replace(/[ ]/g,  '&nbsp;') + '</span>';
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
                                        addressDiff += '<span class="' + markClass + '">' + part.value.replace(/[ ]/g,  '&nbsp;') + '</span>';
                                    });
                                    addressPredictions.push({
                                        addressDiff: addressDiff
                                    });
                                });

                                // Render wrapper.
                                var indexCounter = 0;
                                var predictionsWrapperHtml = ExtendableObject.util.Mustache.render(
                                    $self.config.templates.addressPredictionsPopupWrapper.replace('{{{button}}}', $self.config.templates.button),
                                    {
                                        EnderecoAddressObject: $self,
                                        direction: getComputedStyle(document.querySelector('body')).direction,
                                        predictions: addressPredictions,
                                        mainAddress: mainAddressDiffHtml,
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

                                // Subscribe to events.
                                document.querySelectorAll('[endereco-modal-close]').forEach(function(DOMElement) {
                                    DOMElement.addEventListener('click', function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        $self.util.removePopup();
                                        window.EnderecoIntegrator.hasSubmit = true;
                                        if (ExtendableObject.modalClosed) {
                                            ExtendableObject.modalClosed();
                                        }
                                    })
                                });

                                document.querySelectorAll('[endereco-use-selection]').forEach(function(DOMElement) {
                                    DOMElement.addEventListener('click', function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        $self.cb.copyAddressFromPrediction();
                                        $self.onAfterAddressCheckSelected.forEach(function(cb) {
                                            cb($self);
                                        })
                                        $self.waitForAllPopupsToClose().then(function() {
                                            $self.waitUntilReady().then(function() {
                                                if (window.EnderecoIntegrator && window.EnderecoIntegrator.submitResume) {
                                                    window.EnderecoIntegrator.submitResume();
                                                }
                                            }).catch(function() {
                                                if (window.EnderecoIntegrator && window.EnderecoIntegrator.submitResume) {
                                                    window.EnderecoIntegrator.submitResume();
                                                }
                                            })
                                        }).catch()
                                        $self.util.removePopup();
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
                            } else {
                                window.EnderecoIntegrator.popupQueue--;
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
                            if (0 < ExtendableObject.addressPredictions.length && ExtendableObject.addressPredictions[0].countryCode !== ExtendableObject.countryCode) {
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
                    if (ExtendableObject.hasLoadedExtension('PostalCodeExtension')) {
                        var postalCodeStatus = [];
                        if (value.includes('address_correct')) {
                            postalCodeStatus.push('postal_code_correct');
                        }
                        if (value.includes('address_needs_correction')) {
                            if (0 < ExtendableObject.addressPredictions.length && ExtendableObject.addressPredictions[0].postalCode !== ExtendableObject.postalCode) {
                                postalCodeStatus.push('postal_code_needs_correction');
                            } else {
                                postalCodeStatus.push('postal_code_correct');
                            }
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
                        if (value.includes('address_correct')) {
                            localityStatus.push('locality_correct');
                        }
                        if (value.includes('address_needs_correction')) {
                            if (0 < ExtendableObject.addressPredictions.length && ExtendableObject.addressPredictions[0].locality !== ExtendableObject.locality) {
                                localityStatus.push('locality_needs_correction');
                            } else {
                                localityStatus.push('locality_correct');
                            }
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
                        if (value.includes('address_correct')) {
                            streetNameStatus.push('street_name_correct');
                        }
                        if (value.includes('address_needs_correction')) {
                            if (0 < ExtendableObject.addressPredictions.length && ExtendableObject.addressPredictions[0].streetName !== ExtendableObject.streetName) {
                                streetNameStatus.push('street_name_needs_correction');
                            } else {
                                streetNameStatus.push('street_name_correct');
                            }
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
                        if (value.includes('address_correct')) {
                            streetFullStatus.push('street_full_correct');
                        }
                        if (value.includes('address_needs_correction')) {
                            if (0 < ExtendableObject.addressPredictions.length && ExtendableObject.addressPredictions[0].streetName !== ExtendableObject.streetName) {
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
                        if (value.includes('address_correct') && ExtendableObject.buildingNumber) {
                            buildingNumberStatus.push('building_number_correct');
                        }
                        if (value.includes('address_needs_correction') && ExtendableObject.buildingNumber) {
                            if (0 < ExtendableObject.addressPredictions.length && ExtendableObject.addressPredictions[0].buildingNumber !== ExtendableObject.buildingNumber) {
                                buildingNumberStatus.push('building_number_needs_correction');
                            } else {
                                buildingNumberStatus.push('building_number_correct');
                            }
                        }
                        if (value.includes('address_multiple_variants') && ExtendableObject.buildingNumber) {
                            buildingNumberStatus.push('address_multiple_variants');
                        }
                        if (value.includes('address_not_found') && ExtendableObject.buildingNumber) {
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
                        return; // Dont copy, -1 is current values.
                    }
                    var addressData = $self.addressPredictions[index];
                    $self.fieldNames.forEach( function(fieldName) {
                        if(undefined !== $self[fieldName] && undefined !== addressData[fieldName]) {
                            $self[fieldName] = addressData[fieldName];
                        }
                    });

                    $self.addressStatus = ['address_correct', 'address_selected_by_customer'];
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
                                newValue.push('address_correct');
                            }
                            if (value.includes('A1000') && value.includes('A1100')) {
                                newValue.push('address_needs_correction');
                            }
                            if (value.includes('A2000')) {
                                newValue.push('address_multiple_variants');
                            }
                            if (value.includes('A3000')) {
                                newValue.push('address_not_found');
                            }
                            if (0 < newValue.length) {
                                value = newValue;
                            }

                            if (!ExtendableObject.util.isEqual(oldValue, value)) {
                                ExtendableObject._addressStatus = value;
                                ExtendableObject._changed = false;

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

                ExtendableObject.util.checkAddress = function(address = null) {
                    if (!address) {
                        address = ExtendableObject.address;
                    }
                    return new ExtendableObject.util.Promise(function(resolve, reject) {

                        ExtendableObject.waitUntilReady().then(function() {
                            var message = {
                                'jsonrpc': '2.0',
                                'id': 1,
                                'method': 'addressCheck',
                                'params': {
                                    'country': address.countryCode,
                                    'language': ExtendableObject.config.lang,
                                    'postCode': address.postalCode,
                                    'cityName': address.locality,
                                    'additionalInfos': address.additionalInfos
                                }
                            };

                            if (!ExtendableObject.config.splitStreet) {
                                message.params.streetFull = address.streetFull;
                            } else {
                                message.params.street = address.streetName;
                                message.params.houseNumber = address.buildingNumber;
                            }

                            ExtendableObject._awaits++;
                            ExtendableObject.util.axios.post(ExtendableObject.config.apiUrl, message, {
                                timeout: ExtendableObject.config.ux.requestTimeout,
                                headers: {
                                    'X-Auth-Key': ExtendableObject.config.apiKey,
                                    'X-Remote-Api-Url': ExtendableObject.config.remoteApiUrl,
                                    'X-Transaction-Referer': window.location.href,
                                    'X-Transaction-Id': (ExtendableObject.hasLoadedExtension('SessionExtension'))?ExtendableObject.sessionId:'not_required'
                                }
                            }).then(function(response) {
                                var tempAddressContainer;
                                if (undefined !== response.data.result && undefined !== response.data.result.predictions) {
                                    var copyOfPredictions = [];
                                    var addressCounter = 0;

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

                                        // Filter out identical copy.
                                        if (copyOfPredictions.includes(tempAddressContainer)) {
                                            return false;
                                        }

                                        copyOfPredictions.push(tempAddressContainer);
                                    });

                                    ExtendableObject.addressStatus = response.data.result.status;
                                    ExtendableObject.addressPredictions = copyOfPredictions;

                                    // If specific status - render popup.
                                    if (true) {
                                        ExtendableObject.util.renderAddressPredictionsPopup();
                                    }

                                    resolve();

                                } else {
                                    reject(response);
                                }
                            }).catch(function(e) {
                                reject(e.response);
                            }).finally(function() {
                                ExtendableObject._awaits--;
                            });
                        }).catch()
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

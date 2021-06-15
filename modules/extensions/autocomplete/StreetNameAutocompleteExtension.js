import {diffChars} from "diff";
import streetNamePredictionsTemplate from './../../../templates/street_name_predictions.html';

var StreetNameAutocompleteExtension = {
    name: 'StreetNameAutocompleteExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('StreetNameExtension').then(function() {

                var $streetNameChunkTimeout;

                // Add fields.
                ExtendableObject._streetNameAutocompleteRequestIndex = 1;
                ExtendableObject._streetNameChunk = '';
                ExtendableObject._streetNamePredictions = [];
                ExtendableObject._streetNamePredictionsIndex = 0;
                ExtendableObject._streetNameTimeout = null;
                ExtendableObject._subscribers.streetNameChunk = [];

                // Add config templates.
                ExtendableObject.config.templates.streetNamePredictions = streetNamePredictionsTemplate;

                // Add util function
                ExtendableObject.util.renderStreetNamePredictionsDropdown = function() {
                    // Render dropdown under the input element
                    ExtendableObject._subscribers.streetNameChunk.forEach( function(subscriber) {
                        if (document.querySelector('[endereco-predictions]')) {
                            document.querySelector('[endereco-predictions]').parentNode.removeChild(document.querySelector('[endereco-predictions]'));
                        }

                        // If only one prediction and no difference, then dont render, just copy to fields.
                        if (
                            1 === ExtendableObject._streetNamePredictions.length &&
                            (document.activeElement === subscriber.object) &&
                            ExtendableObject.config.ux.smartFill
                        ) {
                            var inputString = ExtendableObject.streetNameChunk.toLowerCase();
                            var bestMatch = ExtendableObject._streetNamePredictions[0].streetName.substring(0, inputString.length).toLowerCase();
                            if (2 > ExtendableObject.util.levenstein.get(inputString, bestMatch) && 3 < inputString.length) {
                                ExtendableObject.cb.copyStreetNameFromPrediction(0);
                            }
                            return false;
                        }

                        // Render predictions only if the field is active and there are predictions.
                        if (
                            0 < ExtendableObject._streetNamePredictions.length &&
                            (document.activeElement === subscriber.object)
                        ) {
                            var startingIndex = 0;
                            var preparedPredictions = [];

                            // Prepare predictions.
                            ExtendableObject._streetNamePredictions.forEach(function(prediction) {
                                var diff = diffChars(ExtendableObject.streetNameChunk, prediction.streetName, {ignoreCase: true});
                                var streetNameHtml = '';
                                diff.forEach(function(part){
                                    var markClass = part.added ? 'endereco-span--add' :
                                        part.removed ? 'endereco-span--remove' : 'endereco-span--neutral';
                                    streetNameHtml += '<span class="' + markClass + '">' + part.value.replace(/[ ]/g,  '&nbsp;') + '</span>';
                                });

                                preparedPredictions.push({
                                    streetName: prediction.streetName,
                                    postalCode: prediction.postalCode,
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
                            document.querySelectorAll('[data-id="'+ExtendableObject.id+'"] [endereco-street-name-prediction]').forEach(function(DOMElement) {
                                DOMElement.addEventListener('mousedown', function(e) {
                                    var index = parseInt(this.getAttribute('data-prediction-index'))
                                    e.preventDefault();
                                    e.stopPropagation();
                                    ExtendableObject.cb.copyStreetNameFromPrediction(index);
                                })
                            });
                        }
                    });
                };

                ExtendableObject.cb.copyStreetNameFromPrediction = function(index = null) {

                    if (null === index) {
                        index = ExtendableObject._streetNamePredictionsIndex;
                    }

                    if (0 <= index && ExtendableObject.streetNamePredictions[index].postalCode) {
                        ExtendableObject.postalCode = ExtendableObject.streetNamePredictions[index].postalCode;
                    }
                    if (0 <= index && ExtendableObject.streetNamePredictions[index].streetName) {
                        ExtendableObject.streetName = ExtendableObject.streetNamePredictions[index].streetName;
                    }

                    ExtendableObject.streetNamePredictions = [];
                    ExtendableObject._streetNamePredictionsIndex = 0;
                };

                ExtendableObject.cb.streetNameChunkInput = function(subscriber) {
                    return function(e) {
                        ExtendableObject._changed = true;
                        ExtendableObject.streetNamePredictions = [];
                        ExtendableObject._streetNamePredictionsIndex = 0;
                        ExtendableObject.streetNameChunk = subscriber.value;
                    }
                };

                ExtendableObject.cb.streetNameChunkBlur = function(subscriber) {
                    return function(e) {
                        ExtendableObject.streetNamePredictions = [];
                        ExtendableObject._streetNamePredictionsIndex = 0;
                        if (document.querySelector('[endereco-predictions]')) {
                            document.querySelector('[endereco-predictions]').parentNode.removeChild(document.querySelector('[endereco-predictions]'));
                        }

                        if (!!$streetNameChunkTimeout) {
                            clearTimeout($streetNameChunkTimeout)
                        }
                    }
                };

                // Key events.
                ExtendableObject.cb.streetNameChunkKeydown = function() {
                    return function(e) {
                        if ('ArrowUp' === e.key || 'Up' === e.key) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (-1 < ExtendableObject._streetNamePredictionsIndex) {
                                ExtendableObject._streetNamePredictionsIndex = ExtendableObject._streetNamePredictionsIndex - 1;
                                ExtendableObject.util.renderStreetNamePredictionsDropdown();
                            }
                        } else if ('ArrowDown' === e.key || 'Down' === e.key) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (ExtendableObject._streetNamePredictionsIndex < (ExtendableObject._streetNamePredictions.length-1)) {
                                ExtendableObject._streetNamePredictionsIndex = ExtendableObject._streetNamePredictionsIndex + 1;
                                ExtendableObject.util.renderStreetNamePredictionsDropdown();
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
                                ExtendableObject.cb.copyStreetNameFromPrediction();
                            }
                        } else if('Backspace' === e.key || 'Backspace' === e.key) {
                            ExtendableObject.config.ux.smartFill = false;
                        }
                    }
                };

                // Add property.
                Object.defineProperty(ExtendableObject, 'streetNameChunk', {
                    get: function() {
                        return this._streetNameChunk;
                    },
                    set: function(value) {

                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            if (ExtendableObject._streetNameChunk !== value) {
                                if (value.length < ExtendableObject._streetNameChunk.length) {
                                    ExtendableObject.config.ux.smartFill = false;
                                }
                                ExtendableObject._streetNameChunk = value;

                                if (!!$streetNameChunkTimeout) {
                                    clearTimeout($streetNameChunkTimeout)
                                }

                                // Get predictions.
                                if (
                                    ExtendableObject.active &&
                                    ['general_address', 'shipping_address', 'billing_address'].includes(ExtendableObject.addressType)
                                ) {
                                    clearTimeout(ExtendableObject._streetNameTimeout);
                                    ExtendableObject._streetNameTimeout = setTimeout(function() {
                                        ExtendableObject._streetNameAutocompleteRequestIndex++;
                                        var autocompleteRequestIndex = ExtendableObject._streetNameAutocompleteRequestIndex * 1; // Create a copy.
                                        var message = {
                                            'jsonrpc': '2.0',
                                            'id': ExtendableObject._streetNameAutocompleteRequestIndex,
                                            'method': 'streetAutocomplete',
                                            'params': {
                                                'country': ExtendableObject.countryCode,
                                                'language': ExtendableObject.config.lang,
                                                'postCode': ExtendableObject.postalCode,
                                                'cityName': ExtendableObject.locality,
                                                'street': ExtendableObject.streetNameChunk,
                                                'houseNumber': ExtendableObject.buildingNumber
                                            }
                                        };

                                        // Send user data to remote server for validation.
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
                                        })
                                            .then(function(response) {
                                                if (undefined !== response.data.result && undefined !== response.data.result.predictions) {

                                                    // Is still actual?
                                                    if (autocompleteRequestIndex !== ExtendableObject._streetNameAutocompleteRequestIndex) {
                                                        return;
                                                    }

                                                    var counter = 0;
                                                    var tempStreetNameContainer, diff, streetNameHtml;
                                                    var streetNamePredictionsTemp = [];

                                                    // If session counter is set, increase it.
                                                    if (ExtendableObject.hasLoadedExtension('SessionExtension')) {
                                                        ExtendableObject.sessionCounter++;
                                                    }

                                                    response.data.result.predictions.forEach( function(streetNamePrediction) {
                                                        if (counter >= ExtendableObject.config.ux.maxAutocompletePredictionItems) {
                                                            return false;
                                                        }
                                                        counter++;

                                                        tempStreetNameContainer = {
                                                            countryCode: (streetNamePrediction.country)?streetNamePrediction.country: ExtendableObject._countryCode,
                                                            streetName: (streetNamePrediction.street)?streetNamePrediction.street:''
                                                        }

                                                        streetNamePredictionsTemp.push(tempStreetNameContainer);
                                                    })

                                                    ExtendableObject.streetNamePredictions = streetNamePredictionsTemp;
                                                }
                                            })
                                            .catch(function(e) {
                                                console.log(e);
                                            })
                                            .finally(function() {
                                                ExtendableObject._awaits--;
                                            });
                                    }, ExtendableObject.config.ux.delay.inputAssistant);
                                }
                            }
                        }).catch().finally(function() {
                            ExtendableObject._awaits--;
                        })
                    }
                });


                Object.defineProperty(ExtendableObject, 'streetNamePredictions', {
                    get: function() {
                        return this._streetNamePredictions;
                    },
                    set: function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value)
                            .then(function(value) {
                                if (ExtendableObject.streetNamePredictions !== value) {
                                    ExtendableObject._streetNamePredictions = value;

                                    // If any subscriber focused, render it under.
                                    ExtendableObject.util.renderStreetNamePredictionsDropdown();
                                }
                            })
                            .catch()
                            .finally(function() {
                                ExtendableObject._awaits--;
                            });
                    }
                });

                if (ExtendableObject.config.showDebugInfo) {
                    console.log('StreetNameAutocompleteExtension applied');
                }

                resolve($self);
            }).catch(function(e) {
                console.log('Failed to load because of timeout');
                reject($self);
            });
        });
    }
}

export default StreetNameAutocompleteExtension

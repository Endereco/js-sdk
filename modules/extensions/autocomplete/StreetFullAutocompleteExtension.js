import {diffChars} from "diff";
import streetFullPredictionsTemplate from './../../../templates/street_full_predictions.html';
import streetFullTemplateFactory from './../../../templates/streetNameTemplates.js';

var StreetFullAutocompleteExtension = {
    name: 'StreetFullAutocompleteExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('StreetFullExtension').then(function() {

                var $streetFullChunkTimeout;

                // Add fields.
                ExtendableObject._streetFullAutocompleteRequestIndex = 1;
                ExtendableObject._streetFullChunk = '';
                ExtendableObject._streetFullPredictions = [];
                ExtendableObject._streetFullPredictionsIndex = 0;
                ExtendableObject._streetFullTimeout = null;
                ExtendableObject._subscribers.streetFullChunk = [];

                // Add config templates.
                ExtendableObject.config.templates.streetFullPredictions = streetFullPredictionsTemplate;

                // Add util function
                ExtendableObject.util.renderStreetFullPredictionsDropdown = function() {
                    // Render dropdown under the input element
                    ExtendableObject._subscribers.streetFullChunk.forEach( function(subscriber) {
                        if (document.querySelector('[endereco-predictions]')) {
                            document.querySelector('[endereco-predictions]').parentNode.removeChild(document.querySelector('[endereco-predictions]'));
                        }

                        // If only one prediction and no difference, then dont render, just copy to fields.
                        if (
                            1 === ExtendableObject._streetFullPredictions.length &&
                            (document.activeElement === subscriber.object) &&
                            ExtendableObject.config.ux.smartFill
                        ) {
                            var inputString = ExtendableObject.streetFullChunk.toLowerCase();
                            var bestMatch = ExtendableObject._streetFullPredictions[0].streetFull.substring(0, inputString.length).toLowerCase();
                            if (2 > ExtendableObject.util.levenstein.get(inputString, bestMatch) && 3 < inputString.length) {
                                ExtendableObject.cb.copyStreetFullFromPrediction(0);
                            }
                            return false;
                        }

                        // Render predictions only if the field is active and there are predictions.
                        if (
                            0 < ExtendableObject._streetFullPredictions.length &&
                            (document.activeElement === subscriber.object)
                        ) {
                            var startingIndex = 0;
                            var preparedPredictions = [];

                            // Prepare predictions.
                            ExtendableObject._streetFullPredictions.forEach(function(prediction) {
                                var diff = diffChars(ExtendableObject.streetFullChunk, prediction.streetFull, {ignoreCase: true});
                                var streetFullHtml = '';
                                diff.forEach(function(part){
                                    var markClass = part.added ? 'endereco-span--add' :
                                        part.removed ? 'endereco-span--remove' : 'endereco-span--neutral';
                                    streetFullHtml += '<span class="' + markClass + '">' + part.value.replace(/[ ]/g,  '&nbsp;') + '</span>';
                                });

                                preparedPredictions.push({
                                    streetFull: prediction.streetFull,
                                    streetFullDiff: streetFullHtml
                                });
                            })

                            // Prepare dropdown.
                            var predictionsHtml = ExtendableObject.util.Mustache.render(ExtendableObject.config.templates.streetFullPredictions, {
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
                                    var isActive = (startingIndex === ExtendableObject._streetFullPredictionsIndex);
                                    startingIndex++;
                                    return isActive;
                                }
                            });

                            // Attach it to HTML.
                            subscriber.object.insertAdjacentHTML('afterend', predictionsHtml);
                            document.querySelectorAll('[data-id="'+ExtendableObject.id+'"] [endereco-street-full-prediction]').forEach(function(DOMElement) {
                                DOMElement.addEventListener('mousedown', function(e) {
                                    var index = parseInt(this.getAttribute('data-prediction-index'))
                                    e.preventDefault();
                                    e.stopPropagation();
                                    ExtendableObject.cb.copyStreetFullFromPrediction(index);
                                })
                            });
                        }
                    });
                };

                ExtendableObject.cb.copyStreetFullFromPrediction = function(index = null) {
                    if (null === index) {
                        index = ExtendableObject._streetFullPredictionsIndex;
                    }
                    if (!!$streetFullChunkTimeout) {
                        clearTimeout($streetFullChunkTimeout)
                    }

                    if (0 <= index && ExtendableObject.streetFullPredictions[index].streetFull) {
                        ExtendableObject.streetFull = ExtendableObject.streetFullPredictions[index].streetFull;
                    }

                    ExtendableObject.streetFullPredictions = [];
                    ExtendableObject._streetFullPredictionsIndex = 0;
                };

                ExtendableObject.cb.streetFullChunkInput = function(subscriber) {
                    return function(e) {
                        clearTimeout(ExtendableObject._streetFullTimeout);
                        ExtendableObject._streetFullTimeout = setTimeout(function() {
                            ExtendableObject._changed = true;
                            ExtendableObject.streetFullPredictions = [];
                            ExtendableObject._streetFullPredictionsIndex = 0;
                            ExtendableObject.streetFullChunk = subscriber.value;
                        }, ExtendableObject.config.ux.delay.inputAssistant);

                    }
                };

                ExtendableObject.cb.streetFullChunkBlur = function(subscriber) {
                    return function(e) {
                        ExtendableObject.streetFullPredictions = [];
                        ExtendableObject._streetFullPredictionsIndex = 0;
                        if (document.querySelector('[endereco-predictions]')) {
                            document.querySelector('[endereco-predictions]').parentNode.removeChild(document.querySelector('[endereco-predictions]'));
                        }
                    }
                };

                // Key events.
                ExtendableObject.cb.streetFullChunkKeydown = function() {
                    return function(e) {
                        if ('ArrowUp' === e.key || 'Up' === e.key) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (-1 < ExtendableObject._streetFullPredictionsIndex) {
                                ExtendableObject._streetFullPredictionsIndex = ExtendableObject._streetFullPredictionsIndex - 1;
                                ExtendableObject.util.renderStreetFullPredictionsDropdown();
                            }
                        } else if ('ArrowDown' === e.key || 'Down' === e.key) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (ExtendableObject._streetFullPredictionsIndex < (ExtendableObject._streetFullPredictions.length-1)) {
                                ExtendableObject._streetFullPredictionsIndex = ExtendableObject._streetFullPredictionsIndex + 1;
                                ExtendableObject.util.renderStreetFullPredictionsDropdown();
                            }
                        } else if ('Tab' === e.key || 'Tab' === e.key) {
                            // TODO: configurable activate in future releases.
                            /*
                            if (0 < ExtendableObject._streetFullPredictions.length) {
                                e.preventDefault();
                                e.stopPropagation();
                                ExtendableObject.cb.copyStreetFullFromPrediction();
                            }*/
                        } else if ('Enter' === e.key || 'Enter' === e.key) {
                            if (0 < ExtendableObject._streetFullPredictions.length) {
                                e.preventDefault();
                                e.stopPropagation();
                                ExtendableObject.cb.copyStreetFullFromPrediction();
                            }
                        } else if('Backspace' === e.key || 'Backspace' === e.key) {
                            ExtendableObject.config.ux.smartFill = false;
                        }
                    }
                };

                // Add property.
                Object.defineProperty(ExtendableObject, 'streetFullChunk', {
                    get: function() {
                        return this._streetFullChunk;
                    },
                    set: function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            if (ExtendableObject._streetFullChunk !== value) {
                                if (value.length < ExtendableObject._streetFullChunk.length) {
                                    ExtendableObject.config.ux.smartFill = false;
                                }
                                ExtendableObject._streetFullChunk = value;

                                if (!!$streetFullChunkTimeout) {
                                    clearTimeout($streetFullChunkTimeout)
                                }

                                $streetFullChunkTimeout = setTimeout( function() {
                                    ExtendableObject.streetFull = value;
                                }, 1000);

                                // TODO possible problem, revisit later.
                                /**
                                 * Wipe the inner data for streetname and building number, as those will be regenerated on
                                 * change event.
                                  * @type {string}
                                 * @private
                                 */
                                ExtendableObject._streetName = '';
                                ExtendableObject._buildingNumber = '';

                                // Get predictions.
                                if (
                                    ExtendableObject.config.useAutocomplete &&
                                    ExtendableObject.active &&
                                    ['general_address', 'shipping_address', 'billing_address'].includes(ExtendableObject.addressType)
                                ) {
                                    ExtendableObject._streetFullAutocompleteRequestIndex++;
                                    var autocompleteRequestIndex = ExtendableObject._streetFullAutocompleteRequestIndex * 1; // Create a copy.
                                    var message = {
                                        'jsonrpc': '2.0',
                                        'id': ExtendableObject._streetFullAutocompleteRequestIndex,
                                        'method': 'streetAutocomplete',
                                        'params': {
                                            'country': ExtendableObject.countryCode,
                                            'language': ExtendableObject.config.lang,
                                            'postCode': ExtendableObject.postalCode,
                                            'cityName': ExtendableObject.locality,
                                            'streetFull': ExtendableObject.streetFullChunk
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
                                                if (autocompleteRequestIndex !== ExtendableObject._streetFullAutocompleteRequestIndex) {
                                                    return;
                                                }

                                                var counter = 0;
                                                var tempStreetFullContainer, diff, streetFullHtml;
                                                var streetFullPredictionsTemp = [];

                                                // If session counter is set, increase it.
                                                if (ExtendableObject.hasLoadedExtension('SessionExtension')) {
                                                    ExtendableObject.sessionCounter++;
                                                }

                                                response.data.result.predictions.forEach( function(streetFullPrediction) {
                                                    if (counter >= ExtendableObject.config.ux.maxAutocompletePredictionItems) {
                                                        return false;
                                                    }
                                                    counter++;

                                                    tempStreetFullContainer = {
                                                        countryCode: (streetFullPrediction.country)?streetFullPrediction.country: ExtendableObject._countryCode,
                                                        streetName: (streetFullPrediction.street)?streetFullPrediction.street:'',
                                                        buildingNumber: (streetFullPrediction.buildingNumber)?streetFullPrediction.buildingNumber:''
                                                    }

                                                    tempStreetFullContainer.streetFull = ExtendableObject.util.Mustache.render(
                                                        streetFullTemplateFactory.getTemplate(tempStreetFullContainer.countryCode),
                                                        {
                                                            streetName: tempStreetFullContainer.streetName,
                                                            buildingNumber: tempStreetFullContainer.buildingNumber
                                                        }
                                                    ).replace(/(\r\n|\n|\r)/gm, "");

                                                    streetFullPredictionsTemp.push(tempStreetFullContainer);
                                                })

                                                ExtendableObject.streetFullPredictions = streetFullPredictionsTemp;
                                            }
                                        })
                                        .catch(function(e) {
                                            console.log(e);
                                        })
                                        .finally(function() {
                                            ExtendableObject._awaits--;
                                        });
                                }
                            }
                        }).catch().finally(function() {
                            ExtendableObject._awaits--;
                        })
                    }
                });


                Object.defineProperty(ExtendableObject, 'streetFullPredictions', {
                    get: function() {
                        return this._streetFullPredictions;
                    },
                    set: function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value)
                            .then(function(value) {
                                if (ExtendableObject.streetFullPredictions !== value) {
                                    ExtendableObject._streetFullPredictions = value;

                                    // If any subscriber focused, render it under.
                                    ExtendableObject.util.renderStreetFullPredictionsDropdown();
                                }
                            })
                            .catch()
                            .finally(function() {
                                ExtendableObject._awaits--;
                            });
                    }
                });

                if (ExtendableObject.config.showDebugInfo) {
                    console.log('StreetFullAutocompleteExtension applied');
                }

                resolve($self);
            }).catch(function(e) {
                console.log('Failed to load because of timeout');
                reject($self);
            });
        });
    }
}

export default StreetFullAutocompleteExtension

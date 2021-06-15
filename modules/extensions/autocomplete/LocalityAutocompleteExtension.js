import {diffChars} from "diff";
import localityPredictionsTemplate from './../../../templates/locality_predictions.html';

var LocalityAutocompleteExtension = {
    name: 'LocalityAutocompleteExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('LocalityExtension').then(function() {

                var $localityPredictionTimeout;

                // Add fields.
                ExtendableObject._localityAutocompleteRequestIndex = 1;
                ExtendableObject._localityChunk = '';
                ExtendableObject._localityPredictions = [];
                ExtendableObject._localityPredictionsIndex = 0;
                ExtendableObject._localityTimeout = null;
                ExtendableObject._subscribers.localityChunk = [];

                // Add config templates.
                ExtendableObject.config.templates.localityPredictions = localityPredictionsTemplate;

                // Add util function
                ExtendableObject.util.renderLocalityPredictionsDropdown = function() {
                    // Render dropdown under the input element
                    ExtendableObject._subscribers.localityChunk.forEach( function(subscriber) {
                        if (document.querySelector('[endereco-predictions]')) {
                            document.querySelector('[endereco-predictions]').parentNode.removeChild(document.querySelector('[endereco-predictions]'));
                        }

                        // If only one prediction and no difference, then dont render, just copy to fields.
                        if (
                            1 === ExtendableObject._localityPredictions.length &&
                            (document.activeElement === subscriber.object) &&
                            ExtendableObject.config.ux.smartFill
                        ) {
                            var inputString = ExtendableObject.localityChunk.toLowerCase();
                            var bestMatch = ExtendableObject._localityPredictions[0].locality.substring(0, inputString.length).toLowerCase();
                            if (2 > ExtendableObject.util.levenstein.get(inputString, bestMatch) && 3 < inputString.length) {
                                ExtendableObject.cb.copyLocalityFromPrediction(0);
                            }
                            return false;
                        }

                        // Render predictions only if the field is active and there are predictions.
                        if (
                            0 < ExtendableObject._localityPredictions.length &&
                            (document.activeElement === subscriber.object)
                        ) {
                            var startingIndex = 0;
                            var preparedPredictions = [];

                            // Prepare predictions.
                            ExtendableObject._localityPredictions.forEach(function(prediction) {
                                var diff = diffChars(ExtendableObject.localityChunk, prediction.locality, {ignoreCase: true});
                                var localityHtml = '';
                                diff.forEach(function(part){
                                    var markClass = part.added ? 'endereco-span--add' :
                                        part.removed ? 'endereco-span--remove' : 'endereco-span--neutral';
                                    localityHtml += '<span class="' + markClass + '">' + part.value.replace(/[ ]/g,  '&nbsp;') + '</span>';
                                });

                                preparedPredictions.push({
                                    locality: prediction.locality,
                                    postalCode: prediction.postalCode,
                                    localityDiff: localityHtml
                                });
                            })

                            // Prepare dropdown.
                            var predictionsHtml = ExtendableObject.util.Mustache.render(ExtendableObject.config.templates.localityPredictions, {
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
                                    var isActive = (startingIndex === ExtendableObject._localityPredictionsIndex);
                                    startingIndex++;
                                    return isActive;
                                }
                            });

                            // Attach it to HTML.
                            subscriber.object.insertAdjacentHTML('afterend', predictionsHtml);
                            document.querySelectorAll('[data-id="'+ExtendableObject.id+'"] [endereco-locality-prediction]').forEach(function(DOMElement) {
                                DOMElement.addEventListener('mousedown', function(e) {
                                    var index = parseInt(this.getAttribute('data-prediction-index'))
                                    e.preventDefault();
                                    e.stopPropagation();
                                    ExtendableObject.cb.copyLocalityFromPrediction(index);
                                })
                            });
                        }
                    });
                };

                ExtendableObject.cb.copyLocalityFromPrediction = function(index = null) {

                    if (null === index) {
                        index = ExtendableObject._localityPredictionsIndex;
                    }

                    if (0 <= index && ExtendableObject.localityPredictions[index].postalCode) {
                        ExtendableObject.postalCode = ExtendableObject.localityPredictions[index].postalCode;
                    }
                    if (0 <= index && ExtendableObject.localityPredictions[index].locality) {
                        ExtendableObject.locality = ExtendableObject.localityPredictions[index].locality;
                    }

                    ExtendableObject.localityPredictions = [];
                    ExtendableObject._localityPredictionsIndex = 0;
                };

                ExtendableObject.cb.localityChunkInput = function(subscriber) {
                    return function(e) {
                        ExtendableObject._changed = true;
                        ExtendableObject.localityPredictions = [];
                        ExtendableObject._localityPredictionsIndex = 0;
                        ExtendableObject.localityChunk = subscriber.value;
                    }
                };

                ExtendableObject.cb.localityChunkBlur = function(subscriber) {
                    return function(e) {
                        ExtendableObject.localityPredictions = [];
                        ExtendableObject._localityPredictionsIndex = 0;
                        if (document.querySelector('[endereco-predictions]')) {
                            document.querySelector('[endereco-predictions]').parentNode.removeChild(document.querySelector('[endereco-predictions]'));
                        }

                        if (!!$localityPredictionTimeout) {
                            clearTimeout($localityPredictionTimeout)
                        }
                    }
                };

                // Key events.
                ExtendableObject.cb.localityChunkKeydown = function() {
                    return function(e) {
                        if ('ArrowUp' === e.key || 'Up' === e.key) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (-1 < ExtendableObject._localityPredictionsIndex) {
                                ExtendableObject._localityPredictionsIndex = ExtendableObject._localityPredictionsIndex - 1;
                                ExtendableObject.util.renderLocalityPredictionsDropdown();
                            }
                        } else if ('ArrowDown' === e.key || 'Down' === e.key) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (ExtendableObject._localityPredictionsIndex < (ExtendableObject._localityPredictions.length-1)) {
                                ExtendableObject._localityPredictionsIndex = ExtendableObject._localityPredictionsIndex + 1;
                                ExtendableObject.util.renderLocalityPredictionsDropdown();
                            }
                        } else if ('Tab' === e.key || 'Tab' === e.key) {
                            // TODO: configurable activate in future releases.
                            /*if (0 < ExtendableObject._localityPredictions.length) {
                                e.preventDefault();
                                e.stopPropagation();
                                ExtendableObject.cb.copyLocalityFromPrediction();
                            }*/
                        } else if ('Enter' === e.key || 'Enter' === e.key) {
                            if (0 < ExtendableObject._localityPredictions.length) {
                                e.preventDefault();
                                e.stopPropagation();
                                ExtendableObject.cb.copyLocalityFromPrediction();
                            }
                        } else if('Backspace' === e.key || 'Backspace' === e.key) {
                            ExtendableObject.config.ux.smartFill = false;
                        }
                    }
                };

                // Add property.
                Object.defineProperty(ExtendableObject, 'localityChunk', {
                    get: function() {
                        return this._localityChunk;
                    },
                    set: function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            if (ExtendableObject._localityChunk !== value) {
                                if (value.length < ExtendableObject._localityChunk.length) {
                                    ExtendableObject.config.ux.smartFill = false;
                                }
                                ExtendableObject._localityChunk = value;

                                if (!!$localityPredictionTimeout) {
                                    clearTimeout($localityPredictionTimeout)
                                }

                                // Get predictions.
                                if (ExtendableObject.active) {
                                    clearTimeout(ExtendableObject._localityTimeout);
                                    ExtendableObject._localityTimeout = setTimeout(function() {
                                        ExtendableObject._localityAutocompleteRequestIndex++;
                                        var autocompleteRequestIndex = ExtendableObject._localityAutocompleteRequestIndex * 1; // Create a copy.
                                        var message = {
                                            'jsonrpc': '2.0',
                                            'id': ExtendableObject._localityAutocompleteRequestIndex,
                                            'method': 'cityNameAutocomplete',
                                            'params': {
                                                'country': ExtendableObject.countryCode,
                                                'language': ExtendableObject.config.lang,
                                                'postCode': ExtendableObject.postalCode,
                                                'cityName': ExtendableObject.localityChunk,
                                                'street': ExtendableObject.streetName,
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
                                                    if (autocompleteRequestIndex !== ExtendableObject._localityAutocompleteRequestIndex) {
                                                        return;
                                                    }

                                                    var counter = 0;
                                                    var tempLocalityContainer, diff, localityHtml;
                                                    var localityPredictionsTemp = [];

                                                    // If session counter is set, increase it.
                                                    if (ExtendableObject.hasLoadedExtension('SessionExtension')) {
                                                        ExtendableObject.sessionCounter++;
                                                    }

                                                    response.data.result.predictions.forEach( function(localityPrediction) {
                                                        if (counter >= ExtendableObject.config.ux.maxAutocompletePredictionItems) {
                                                            return false;
                                                        }
                                                        counter++;

                                                        tempLocalityContainer = {
                                                            countryCode: (localityPrediction.country)?localityPrediction.country: ExtendableObject._countryCode,
                                                            postalCode: (localityPrediction.postCode)?localityPrediction.postCode:'',
                                                            locality: (localityPrediction.cityName)?localityPrediction.cityName:''
                                                        }

                                                        localityPredictionsTemp.push(tempLocalityContainer);
                                                    })

                                                    ExtendableObject.localityPredictions = localityPredictionsTemp;
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


                Object.defineProperty(ExtendableObject, 'localityPredictions', {
                    get: function() {
                        return this._localityPredictions;
                    },
                    set: function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value)
                            .then(function(value) {
                                if (ExtendableObject.localityPredictions !== value) {
                                    ExtendableObject._localityPredictions = value;

                                    // If any subscriber focused, render it under.
                                    ExtendableObject.util.renderLocalityPredictionsDropdown();
                                }
                            })
                            .catch()
                            .finally(function() {
                                ExtendableObject._awaits--;
                            });
                    }
                });

                if (ExtendableObject.config.showDebugInfo) {
                    console.log('LocalityAutocompleteExtension applied');
                }

                resolve($self);
            }).catch(function(e) {
                console.log('Failed to load because of timeout');
                reject($self);
            });
        });
    }
}

export default LocalityAutocompleteExtension

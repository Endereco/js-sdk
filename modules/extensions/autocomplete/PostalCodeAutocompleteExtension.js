import {diffChars} from "diff";
import postalCodePredictionsTemplate from './../../../templates/postal_code_predictions.html';

var PostalCodeAutocompleteExtension = {
    name: 'PostalCodeAutocompleteExtension',
    extend: function(ExtendableObject) {
        var $self = this;

        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject.waitForExtension('PostalCodeExtension').then(function() {

                // Add fields.
                ExtendableObject._postalCodeChunk = '';
                ExtendableObject._postalCodePredictions = [];
                ExtendableObject._postalCodePredictionsIndex = 0;
                ExtendableObject._postalCodeTimeout = null;
                ExtendableObject._subscribers.postalCodeChunk = [];

                // Add config templates.
                ExtendableObject.config.templates.postalCodePredictions = postalCodePredictionsTemplate;

                // Add util function
                ExtendableObject.util.renderPostalCodePredictionsDropdown = function() {
                    // Render dropdown under the input element
                    ExtendableObject._subscribers.postalCodeChunk.forEach( function(subscriber) {
                        if (document.querySelector('[endereco-predictions]')) {
                            document.querySelector('[endereco-predictions]').parentNode.removeChild(document.querySelector('[endereco-predictions]'));
                        }

                        // If only one prediction and no difference, then dont render, just copy to fields.
                        if (
                            1 === ExtendableObject._postalCodePredictions.length &&
                            (document.activeElement === subscriber.object) &&
                            ExtendableObject.config.ux.smartFill
                        ) {
                            var inputString = ExtendableObject.postalCodeChunk.toLowerCase();
                            var bestMatch = ExtendableObject._postalCodePredictions[0].postalCode.substring(0, inputString.length).toLowerCase();
                            if (2 > ExtendableObject.util.levenstein.get(inputString, bestMatch) && 3 < inputString.length) {
                                ExtendableObject.cb.copyPostalCodeFromPrediction(0);
                            }
                            return false;
                        }

                        // Render predictions only if the field is active and there are predictions.
                        if (
                            0 < ExtendableObject._postalCodePredictions.length &&
                            (document.activeElement === subscriber.object)
                        ) {
                            var startingIndex = 0;
                            var preparedPredictions = [];

                            // Prepare predictions.
                            ExtendableObject._postalCodePredictions.forEach(function(prediction) {
                                var diff = diffChars(ExtendableObject.postalCodeChunk, prediction.postalCode, {ignoreCase: true});
                                var postalCodeHtml = '';
                                diff.forEach(function(part){
                                    var markClass = part.added ? 'endereco-span--add' :
                                        part.removed ? 'endereco-span--remove' : 'endereco-span--neutral';
                                    postalCodeHtml += '<span class="' + markClass + '">' + part.value.replace(/[ ]/g,  '&nbsp;') + '</span>';
                                });

                                preparedPredictions.push({
                                    postalCode: prediction.postalCode,
                                    locality: prediction.locality,
                                    postalCodeDiff: postalCodeHtml
                                });
                            })

                            // Prepare dropdown.
                            var predictionsHtml = ExtendableObject.util.Mustache.render(ExtendableObject.config.templates.postalCodePredictions, {
                                ExtendableObject: ExtendableObject,
                                predictions: preparedPredictions,
                                offsetTop: subscriber.object.offsetTop + subscriber.object.offsetHeight,
                                offsetLeft: subscriber.object.offsetLeft,
                                width: subscriber.object.offsetWidth,
                                direction: getComputedStyle(subscriber.object).direction,
                                index: function() {
                                    return (startingIndex-1); // TODO: add loop finishing function to increase counter.
                                },
                                isActive: function(){
                                    var isActive = (startingIndex === ExtendableObject._postalCodePredictionsIndex);
                                    startingIndex++;
                                    return isActive;
                                }
                            });

                            // Attach it to HTML.
                            subscriber.object.insertAdjacentHTML('afterend', predictionsHtml);
                            document.querySelectorAll('[data-id="'+ExtendableObject.id+'"] [endereco-postal-code-prediction]').forEach(function(DOMElement) {
                                DOMElement.addEventListener('mousedown', function(e) {
                                    var index = parseInt(this.getAttribute('data-prediction-index'))
                                    e.preventDefault();
                                    e.stopPropagation();
                                    ExtendableObject.cb.copyPostalCodeFromPrediction(index);
                                })
                            });
                        }
                    });
                };

                ExtendableObject.cb.copyPostalCodeFromPrediction = function(index = null) {

                    if (null === index) {
                        index = ExtendableObject._postalCodePredictionsIndex;
                    }

                    if (0 <= index && ExtendableObject.postalCodePredictions[index].postalCode) {
                        ExtendableObject.postalCode = ExtendableObject.postalCodePredictions[index].postalCode;
                    }
                    if (0 <= index && ExtendableObject.postalCodePredictions[index].locality) {
                        ExtendableObject.locality = ExtendableObject.postalCodePredictions[index].locality;
                    }

                    ExtendableObject.postalCodePredictions = [];
                    ExtendableObject._postalCodePredictionsIndex = 0;
                };

                ExtendableObject.cb.postalCodeChunkInput = function(subscriber) {
                    return function(e) {
                        ExtendableObject._changed = true;
                        ExtendableObject.postalCodePredictions = [];
                        ExtendableObject._postalCodePredictionsIndex = 0;
                        ExtendableObject.postalCodeChunk = subscriber.value;
                    }
                };

                ExtendableObject.cb.postalCodeChunkBlur = function(subscriber) {
                    return function(e) {
                        ExtendableObject.postalCodePredictions = [];
                        ExtendableObject._postalCodePredictionsIndex = 0;
                        if (document.querySelector('[endereco-predictions]')) {
                            document.querySelector('[endereco-predictions]').parentNode.removeChild(document.querySelector('[endereco-predictions]'));
                        }
                    }
                };

                // Key events.
                ExtendableObject.cb.postalCodeChunkKeydown = function() {
                    return function(e) {
                        if ('ArrowUp' === e.key || 'Up' === e.key) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (-1 < ExtendableObject._postalCodePredictionsIndex) {
                                ExtendableObject._postalCodePredictionsIndex = ExtendableObject._postalCodePredictionsIndex - 1;
                                ExtendableObject.util.renderPostalCodePredictionsDropdown();
                            }
                        } else if ('ArrowDown' === e.key || 'Down' === e.key) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (ExtendableObject._postalCodePredictionsIndex < (ExtendableObject._postalCodePredictions.length-1)) {
                                ExtendableObject._postalCodePredictionsIndex = ExtendableObject._postalCodePredictionsIndex + 1;
                                ExtendableObject.util.renderPostalCodePredictionsDropdown();
                            }
                        } else if ('Tab' === e.key || 'Tab' === e.key) {
                            if (0 < ExtendableObject._postalCodePredictions.length) {
                                e.preventDefault();
                                e.stopPropagation();
                                ExtendableObject.cb.copyPostalCodeFromPrediction();
                            }
                        } else if ('Enter' === e.key || 'Enter' === e.key) {
                            if (0 < ExtendableObject._postalCodePredictions.length) {
                                e.preventDefault();
                                e.stopPropagation();
                                ExtendableObject.cb.copyPostalCodeFromPrediction();
                            }
                        } else if('Backspace' === e.key || 'Backspace' === e.key) {
                            ExtendableObject.config.ux.smartFill = false;
                        }
                    }
                };

                // Add property.
                Object.defineProperty(ExtendableObject, 'postalCodeChunk', {
                    get: function() {
                        return this._postalCodeChunk;
                    },
                    set: function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value).then(function(value) {
                            if (ExtendableObject._postalCodeChunk !== value) {
                                if (value.length < ExtendableObject._postalCodeChunk.length) {
                                    ExtendableObject.config.ux.smartFill = false;
                                }
                                ExtendableObject._postalCodeChunk = value;

                                // Get predictions.
                                if (ExtendableObject.active) {
                                    clearTimeout(ExtendableObject._postalCodeTimeout);
                                    ExtendableObject._postalCodeTimeout = setTimeout(function() {
                                        var message = {
                                            'jsonrpc': '2.0',
                                            'id': 1,
                                            'method': 'postCodeAutocomplete',
                                            'params': {
                                                'country': ExtendableObject.countryCode,
                                                'language': ExtendableObject.config.lang,
                                                'postCode': ExtendableObject.postalCodeChunk,
                                                'cityName': ExtendableObject.locality,
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
                                                'X-Remote-Api-Url': ExtendableObject.config.remoteApiUrl,
                                                'X-Transaction-Referer': window.location.href,
                                                'X-Transaction-Id': (ExtendableObject.hasLoadedExtension('SessionExtension'))?ExtendableObject.sessionId:'not_required'
                                            }
                                        })
                                            .then(function(response) {
                                                if (undefined !== response.data.result && undefined !== response.data.result.predictions) {
                                                    var counter = 0;
                                                    var tempPostalCodeContainer, diff, postalCodeHtml;
                                                    var postalCodePredictionsTemp = [];

                                                    // If session counter is set, increase it.
                                                    if (ExtendableObject.hasLoadedExtension('SessionExtension')) {
                                                        ExtendableObject.sessionCounter++;
                                                    }

                                                    response.data.result.predictions.forEach( function(postalCodePrediction) {
                                                        if (counter >= ExtendableObject.config.ux.maxAutocompletePredictionItems) {
                                                            return false;
                                                        }
                                                        counter++;

                                                        tempPostalCodeContainer = {
                                                            countryCode: (postalCodePrediction.country)?postalCodePrediction.country: ExtendableObject._countryCode,
                                                            postalCode: (postalCodePrediction.postCode)?postalCodePrediction.postCode:'',
                                                            locality: (postalCodePrediction.cityName)?postalCodePrediction.cityName:''
                                                        }

                                                        postalCodePredictionsTemp.push(tempPostalCodeContainer);
                                                    })

                                                    ExtendableObject.postalCodePredictions = postalCodePredictionsTemp;
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


                Object.defineProperty(ExtendableObject, 'postalCodePredictions', {
                    get: function() {
                        return this._postalCodePredictions;
                    },
                    set: function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.util.Promise.resolve(value)
                            .then(function(value) {
                                if (ExtendableObject.postalCodePredictions !== value) {
                                    ExtendableObject._postalCodePredictions = value;

                                    // If any subscriber focused, render it under.
                                    ExtendableObject.util.renderPostalCodePredictionsDropdown();
                                }
                            })
                            .catch()
                            .finally(function() {
                                ExtendableObject._awaits--;
                            });
                    }
                });

                if (ExtendableObject.config.showDebugInfo) {
                    console.log('PostalCodeAutocompleteExtension applied');
                }

                resolve($self);
            }).catch(function(e) {
                console.log('Failed to load because of timeout');
                reject($self);
            });
        });
    }
}

export default PostalCodeAutocompleteExtension

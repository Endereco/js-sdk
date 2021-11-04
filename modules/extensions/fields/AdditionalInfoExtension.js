var AdditionalInfoExtension = {
    name: 'AdditionalInfoExtension',
    extend: function(ExtendableObject) {
        var $self = this;
        return new ExtendableObject.util.Promise(function(resolve, reject) {
            ExtendableObject._additionalInfo = '';
            ExtendableObject._subscribers.additionalInfo = [];

            ExtendableObject.cb.setAdditionalInfo = function(additionalInfo) {
                return new ExtendableObject.util.Promise(function(resolve, reject) {
                    resolve(additionalInfo);
                });
            };

            ExtendableObject.cb.additionalInfoChange = function(subscriber) {
                return function(e) {
                    ExtendableObject.additionalInfo = subscriber.value;
                }
            };

            ExtendableObject.cb.additionalInfoBlur = function(subscriber) {
                return function(e) {
                    ExtendableObject.waitUntilReady().then(function() {

                        if (ExtendableObject.onBlurTimeout) {
                            clearTimeout(ExtendableObject.onBlurTimeout);
                            ExtendableObject.onBlurTimeout = null;
                        }
                        ExtendableObject.onBlurTimeout = setTimeout( function() {
                            if (ExtendableObject.config.trigger.onblur && !ExtendableObject.anyActive() && ExtendableObject.util.shouldBeChecked() && !window.EnderecoIntegrator.hasSubmit) {
                                // Second. Check Address.
                                ExtendableObject.onBlurTimeout = null;
                                ExtendableObject.util.checkAddress().catch();
                            }
                        }, 300);
                    }).catch()
                }
            };

            // Add getter and setter for fields.
            Object.defineProperty(ExtendableObject, 'additionalInfo', {
                get: function() {
                    return this._additionalInfo;
                },
                set: function(value) {
                    ExtendableObject._awaits++;
                    ExtendableObject.util.Promise.resolve(value).then(function(value) {
                        ExtendableObject._awaits++;
                        ExtendableObject.cb.setAdditionalInfo(value).then( function(value) {
                            var oldValue = ExtendableObject._additionalInfo;
                            var newValue = value;

                            var notSame = ExtendableObject._additionalInfo !== value;

                            // Chunk set.
                            if (ExtendableObject.hasLoadedExtension('AdditionalInfoAutocompleteExtension')) {
                                notSame = notSame || ( ExtendableObject._additionalInfoChunk !== value );
                            }

                            if (notSame) {
                                ExtendableObject._additionalInfo = value;

                                if (ExtendableObject.hasLoadedExtension('AdditionalInfoAutocompleteExtension')) {
                                    ExtendableObject._additionalInfoChunk = value;
                                }


                                // Inform all subscribers about the change.
                                ExtendableObject._subscribers.additionalInfo.forEach(function (subscriber) {
                                    subscriber.value = value;
                                });

                                if (ExtendableObject.active) {
                                    ExtendableObject.fire(
                                        new ExtendableObject.util.CustomEvent(
                                            'change',
                                            {
                                                detail: {
                                                    fieldName: 'additionalInfo',
                                                    oldValue: oldValue,
                                                    newValue: newValue,
                                                    object: ExtendableObject
                                                }
                                            }
                                        )
                                    );
                                }
                            }
                        }).catch(function(e) {
                            if (ExtendableObject.config.showDebugInfo) {
                                console.log('Error resolving additionalInfo', e);
                            }
                        }).finally(function() {
                            ExtendableObject._awaits--;
                        });
                    }).catch().finally(function() {
                        ExtendableObject._awaits--;
                    });
                }
            });

            ExtendableObject.fieldNames.push('additionalInfo');

            if (ExtendableObject.config.showDebugInfo) {
                console.log('AdditionalInfoExtension applied');
            }

            resolve($self);
        });
    }
}

export default AdditionalInfoExtension

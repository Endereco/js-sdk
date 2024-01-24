import EnderecoSubscriber from './../../subscriber';
import { v4 as uuidv4 } from 'uuid';

var SessionExtension = {
    name: 'SessionExtension',
    extend: function(ExtendableObject) {
        return new ExtendableObject.util.Promise(function(resolve, reject) {
            // Initialize properties and subscribers
            initializeProperties(ExtendableObject);

            // Define property accessors
            definePropertyAccessors(ExtendableObject);

            // Set interval for form processing
            processFormsInterval(ExtendableObject);

            // Handle onAfterCreate event
            ExtendableObject.onAfterCreate.push(() => handleAfterCreate(ExtendableObject));

            // Add a method to update session id.
            ExtendableObject.util.updateSessionId = function() {
                updateSessionId(ExtendableObject);
            }

            // Debug information
            if (ExtendableObject.config.showDebugInfo) {
                console.log('SessionExtension applied');
            }

            resolve(SessionExtension);
        });
    }
}

function initializeProperties(ExtendableObject) {
    ExtendableObject._sessionId = '';
    ExtendableObject._subscribers.sessionId = [];
    ExtendableObject._sessionCounter = '';
    ExtendableObject._subscribers.sessionCounter = [];

    ExtendableObject.forms = [];
    ExtendableObject.formsWithSession = [];
}

function definePropertyAccessors(ExtendableObject) {
    createAccessor(ExtendableObject, 'sessionId');
    createAccessor(ExtendableObject, 'sessionCounter');
}

function createAccessor(ExtendableObject, propertyName) {
    Object.defineProperty(ExtendableObject, propertyName, {
        get: function() { return this['_' + propertyName]; },
        set: function(value) {
            var oldValue = this['_' + propertyName];
            this._awaits++;
            ExtendableObject.util.Promise.resolve(value)
                .then(newValue => {
                    if (oldValue !== newValue) {
                        this['_' + propertyName] = newValue;
                        notifySubscribers(ExtendableObject, propertyName, newValue);
                        fireChangeEvent(ExtendableObject, propertyName, oldValue, newValue);
                    }
                })
                .catch(console.error)
                .finally(() => this._awaits--);
        }
    });
}

function notifySubscribers(ExtendableObject, propertyName, newValue) {
    ExtendableObject._subscribers[propertyName].forEach(subscriber => {
        subscriber.value = newValue;
    });
}

function fireChangeEvent(ExtendableObject, propertyName, oldValue, newValue) {
    ExtendableObject.fire(new ExtendableObject.util.CustomEvent('change', {
        detail: {
            fieldName: propertyName,
            oldValue,
            newValue,
            object: ExtendableObject
        }
    }));
}

function updateSessionId(ExtendableObject) {
    ExtendableObject.sessionId = uuidv4();
}

function processFormsInterval(ExtendableObject) {
    setInterval(() => {
        if (ExtendableObject.forms.length !== ExtendableObject.formsWithSession.length) {
            ExtendableObject.forms.forEach(form => {
                if (!ExtendableObject.formsWithSession.includes(form)) {
                    addInputIfNotExists(form, ExtendableObject.fullName + '_session_id', ExtendableObject);
                    addInputIfNotExists(form, ExtendableObject.fullName + '_session_counter', ExtendableObject);
                    // Subscribe to own fields
                    subscribeToField(ExtendableObject, 'sessionId');
                    subscribeToField(ExtendableObject, 'sessionCounter');
                    ExtendableObject.formsWithSession.push(form);
                }
                // TODO: we need a handling logic, for when the session fields already exist in a form (from server side template)
            });
        }
    }, 500);
}

function addInputIfNotExists(form, name, ExtendableObject) {
    if (!form.querySelector(`input[name="${name}"]`)) {
        var inputHtml = ExtendableObject.util.Mustache.render('<input type="hidden" name="{{name}}" value="">', { name });
        form.insertAdjacentHTML('afterbegin', inputHtml);
    }
}

function handleAfterCreate(ExtendableObject) {
    ExtendableObject.waitForActive().then(() => {
        ExtendableObject.waitUntilReady().then(() => {
            ExtendableObject.syncValues(['sessionId', 'sessionCounter'])
                .then(() => {
                    if (!ExtendableObject.sessionId) {
                        ExtendableObject.sessionCounter = 0;
                        ExtendableObject.sessionId = ExtendableObject.id;
                    }
                })
                .catch(console.error);
        }).catch(console.error);
    }).catch(console.error);
}

function subscribeToField(ExtendableObject, fieldName) {
    const fieldNameMapping = {
        'sessionId': 'session_id',
        'sessionCounter': 'session_counter'
    }
    var subscriber = new EnderecoSubscriber(
        fieldName,
        document.querySelector(`[name="${ExtendableObject.fullName}_${fieldNameMapping[fieldName]}"]`)
    );
    ExtendableObject.addSubscriber(subscriber);
}

export default SessionExtension;

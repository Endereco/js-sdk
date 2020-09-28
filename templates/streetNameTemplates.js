import defaultTpl from './fullstreet/default.html';
import frTpl from './fullstreet/fr.html';

var templates = {
    default: defaultTpl,
    de: defaultTpl,
    at: defaultTpl,
    fr: frTpl,
    getTemplate: function(countryCode) {
        if(!!this[countryCode]) {
            return this[countryCode];
        } else {
            return this.default;
        }
    }
}

export default templates

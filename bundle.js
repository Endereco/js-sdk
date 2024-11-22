import Promise from 'promise-polyfill';
import Integrator from './src/Integrator';
import css from './themes/default-theme.scss';

if ('NodeList' in window && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function (callback, thisArg) {
        thisArg = thisArg || window;
        for (var i = 0; i < this.length; i++) {
            callback.call(thisArg, this[i], i, this);
        }
    };
}

if (!window.Promise) {
    window.Promise = Promise;
}

const integrator = new Integrator()

if (css) {
    integrator.configService.setConfig(
        'integrator',
        {
            cssCompiled: css[0][1]
        }
    );
}

if (window.EnderecoIntegrator) {
    integrator.onLoad = window.EnderecoIntegrator.onLoad
    integrator.delayedInits = window.EnderecoIntegrator.delayedInits
} 

window.EnderecoIntegrator = integrator;

window.EnderecoIntegrator.domService.addCss();

const waitForExtensionInterval = setInterval( function() {
    if(typeof enderecoExtendIntegrator === 'function'){
        enderecoExtendIntegrator();
        window.EnderecoIntegrator.domService.addCss();
        clearInterval(waitForExtensionInterval);
    }
}, 1);
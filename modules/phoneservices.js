import merge from 'lodash.merge';
import EnderecoBase from './components/base.js'
import flagButtonHTML from '../templates/flagButton.html';


// Flags
import notFoundFlag from '../templates/flags/notFound.svg';
import acFlag from '../templates/flags/ac.svg';
import adFlag from '../templates/flags/ad.svg';
import aeFlag from '../templates/flags/ae.svg';
import afFlag from '../templates/flags/af.svg';
import agFlag from '../templates/flags/ag.svg';
import aiFlag from '../templates/flags/ai.svg';
import alFlag from '../templates/flags/al.svg';
import amFlag from '../templates/flags/am.svg';
import aoFlag from '../templates/flags/ao.svg';
import aqFlag from '../templates/flags/aq.svg';
import arFlag from '../templates/flags/ar.svg';
import asFlag from '../templates/flags/as.svg';
import atFlag from '../templates/flags/at.svg';
import auFlag from '../templates/flags/au.svg';
import awFlag from '../templates/flags/aw.svg';
import axFlag from '../templates/flags/ax.svg';
import azFlag from '../templates/flags/az.svg';
import baFlag from '../templates/flags/ba.svg';
import bbFlag from '../templates/flags/bb.svg';
import bdFlag from '../templates/flags/bd.svg';
import beFlag from '../templates/flags/be.svg';
import bfFlag from '../templates/flags/bf.svg';
import bgFlag from '../templates/flags/bg.svg';
import bhFlag from '../templates/flags/bh.svg';
import biFlag from '../templates/flags/bi.svg';
import bjFlag from '../templates/flags/bj.svg';
import blFlag from '../templates/flags/bl.svg';
import bmFlag from '../templates/flags/bm.svg';
import bnFlag from '../templates/flags/bn.svg';
import boFlag from '../templates/flags/bo.svg';
import bqFlag from '../templates/flags/bq.svg';
import brFlag from '../templates/flags/br.svg';
import bsFlag from '../templates/flags/bs.svg';
import btFlag from '../templates/flags/bt.svg';
import bvFlag from '../templates/flags/bv.svg';
import bwFlag from '../templates/flags/bw.svg';
import byFlag from '../templates/flags/by.svg';
import bzFlag from '../templates/flags/bz.svg';
import caFlag from '../templates/flags/ca.svg';
import ccFlag from '../templates/flags/cc.svg';
import cdFlag from '../templates/flags/cd.svg';
import ceftaFlag from '../templates/flags/cefta.svg';
import cfFlag from '../templates/flags/cf.svg';
import cgFlag from '../templates/flags/cg.svg';
import chFlag from '../templates/flags/ch.svg';
import ciFlag from '../templates/flags/ci.svg';
import ckFlag from '../templates/flags/ck.svg';
import clFlag from '../templates/flags/cl.svg';
import cmFlag from '../templates/flags/cm.svg';
import cnFlag from '../templates/flags/cn.svg';
import coFlag from '../templates/flags/co.svg';
import cpFlag from '../templates/flags/cp.svg';
import crFlag from '../templates/flags/cr.svg';
import cuFlag from '../templates/flags/cu.svg';
import cvFlag from '../templates/flags/cv.svg';
import cwFlag from '../templates/flags/cw.svg';
import cxFlag from '../templates/flags/cx.svg';
import cyFlag from '../templates/flags/cy.svg';
import czFlag from '../templates/flags/cz.svg';
import deFlag from '../templates/flags/de.svg';
import dgFlag from '../templates/flags/dg.svg';
import djFlag from '../templates/flags/dj.svg';
import dkFlag from '../templates/flags/dk.svg';
import dmFlag from '../templates/flags/dm.svg';
import doFlag from '../templates/flags/do.svg';
import dzFlag from '../templates/flags/dz.svg';
import eaFlag from '../templates/flags/ea.svg';
import ecFlag from '../templates/flags/ec.svg';
import eeFlag from '../templates/flags/ee.svg';
import egFlag from '../templates/flags/eg.svg';
import ehFlag from '../templates/flags/eh.svg';
import erFlag from '../templates/flags/er.svg';
import esFlag from '../templates/flags/es.svg';
import esctFlag from '../templates/flags/es-ct.svg';
import esgaFlag from '../templates/flags/es-ga.svg';
import etFlag from '../templates/flags/et.svg';
import euFlag from '../templates/flags/eu.svg';
import fiFlag from '../templates/flags/fi.svg';
import fjFlag from '../templates/flags/fj.svg';
import fkFlag from '../templates/flags/fk.svg';
import fmFlag from '../templates/flags/fm.svg';
import foFlag from '../templates/flags/fo.svg';
import frFlag from '../templates/flags/fr.svg';
import gaFlag from '../templates/flags/ga.svg';
import gbFlag from '../templates/flags/gb.svg';
import gbengFlag from '../templates/flags/gb-eng.svg';
import gbnirFlag from '../templates/flags/gb-nir.svg';
import gbsctFlag from '../templates/flags/gb-sct.svg';
import gbwlsFlag from '../templates/flags/gb-wls.svg';
import gdFlag from '../templates/flags/gd.svg';
import geFlag from '../templates/flags/ge.svg';
import gfFlag from '../templates/flags/gf.svg';
import ggFlag from '../templates/flags/gg.svg';
import ghFlag from '../templates/flags/gh.svg';
import giFlag from '../templates/flags/gi.svg';
import glFlag from '../templates/flags/gl.svg';
import gmFlag from '../templates/flags/gm.svg';
import gnFlag from '../templates/flags/gn.svg';
import gpFlag from '../templates/flags/gp.svg';
import gqFlag from '../templates/flags/gq.svg';
import grFlag from '../templates/flags/gr.svg';
import gsFlag from '../templates/flags/gs.svg';
import gtFlag from '../templates/flags/gt.svg';
import guFlag from '../templates/flags/gu.svg';
import gwFlag from '../templates/flags/gw.svg';
import gyFlag from '../templates/flags/gy.svg';
import hkFlag from '../templates/flags/hk.svg';
import hmFlag from '../templates/flags/hm.svg';
import ioFlag from '../templates/flags/io.svg';

// Extensions.
import PhoneExtension from './extensions/fields/PhoneExtension.js';
import PhoneCheckExtension from "./extensions/checks/PhoneCheckExtension";
import SessionExtension from "./extensions/session/SessionExtension";

function EnderecoPhone(customConfig={}) {

    // Get base object, that will be extended.
    var base = new EnderecoBase();
    base.type = 'phone';
    base.name = 'phoneservices';
    base.numberType = 'general';
    base._flagContainerDom = undefined;
    // Override config.
    base.config = merge(base.config, customConfig);
    base.mapping = [
        {
            iso2: 'af',
            code: '+93',
            flag: afFlag
        },
        {
            iso2: 'al',
            code: '+355',
            flag: alFlag
        }
    ];

    // Add extensions.
    base.extensions = [
        PhoneExtension,
        PhoneCheckExtension,
        SessionExtension
    ]

    // Load extesions.
    base.loadExtensions();

    // Call "onCreate" callbacks.
    base.created();

    base.getFlagHTML = function(numberDigits) {
        var queryStr = numberDigits.trim();
        var returnHtml = '';

        if ('00' === queryStr.substring(0,2)) {
            queryStr = queryStr.replace(/^.{2}/g, '+');
        }

        while (1) {
            base.mapping.forEach( function(country) {
                if (country.code === queryStr && '' !== queryStr) {
                    returnHtml = country.flag;
                }
            });

            queryStr = queryStr.slice(0, -1);

            if ('' !== returnHtml) {
                break;
            }

            if (0 === queryStr.length) {
                break;
            }
        }

        if ('' === returnHtml) {
            returnHtml = notFoundFlag;
        }

        return returnHtml;
    }

    // Render flags method.
    base.renderFlags = function() {
        base._subscribers.phone.forEach( function(subscriber) {
            var DOMElement = subscriber.object;
            var flagsHTML = flagButtonHTML;
            var dropdownHTML = "<div>test2</div>";
            var heightOfInput = 0;
            var heightOfFlag = 0;
            var offsetFromParent = 0;
            var flagElement;
            var topOffset = 0;
            var leftOffset = 0;
            var widthOfFlag = 0;

            if (!DOMElement.classList.contains('endereco-field-has-flags')) {
                // Add flags class
                DOMElement.classList.add('endereco-field-has-flags');

                // Add relative
                DOMElement.parentElement.classList.add('endereco-relative-container');

                // Add flags container.
                DOMElement.insertAdjacentHTML('beforebegin',
                    flagsHTML);
                flagElement = DOMElement.parentElement.querySelector('.endereco-big-flag');
                base._flagContainerDom = flagElement;
                offsetFromParent = DOMElement.offsetTop;
                heightOfInput = DOMElement.offsetHeight;
                heightOfFlag = heightOfInput * 0.75;
                topOffset = offsetFromParent + ((heightOfInput - heightOfFlag) / 2);
                leftOffset = ((heightOfInput - heightOfFlag) / 2);

                flagElement.style.top = `${topOffset}px`;
                flagElement.style.left = `${leftOffset}px`;

                flagElement.querySelector('.endereco-flag').style.height = `${heightOfFlag}px`;
                flagElement.querySelector('.endereco-flag').style.width = `${heightOfFlag}px`;

                widthOfFlag = flagElement.offsetWidth + 4;
                DOMElement.style.paddingLeft= `${widthOfFlag}px`;

                // Add input listener.
                DOMElement.addEventListener('input', function(e) {
                    flagElement.querySelector('.endereco-flag').innerHTML = base.getFlagHTML(
                        e.target.value.substring(0,5)
                    );
                });

                // Add autocomplete für diverse codes.
                DOMElement.insertAdjacentHTML('afterend',
                    dropdownHTML);
            }

        });
    }

    return base;
}

export default EnderecoPhone

import merge from 'lodash.merge';
import EnderecoBase from './components/base.js'
import flagButtonHTML from '../templates/flagButton.html';
import phoneDropdownHTML from '../templates/phoneDropdownHTML.html';
import Mustache from "mustache";

// Flags
import notFoundFlag from '../templates/icons/not_found.svg';
import afFlag from '../templates/flags/af.svg';
import alFlag from '../templates/flags/al.svg';
import dzFlag from '../templates/flags/dz.svg';
import asFlag from '../templates/flags/as.svg';
import adFlag from '../templates/flags/ad.svg';
import aoFlag from '../templates/flags/ao.svg';
import aiFlag from '../templates/flags/ai.svg';
import aqFlag from '../templates/flags/aq.svg';
import agFlag from '../templates/flags/ag.svg';
import arFlag from '../templates/flags/ar.svg';
import amFlag from '../templates/flags/am.svg';
import awFlag from '../templates/flags/aw.svg';
import auFlag from '../templates/flags/au.svg';
import atFlag from '../templates/flags/at.svg';
import azFlag from '../templates/flags/az.svg';
import bsFlag from '../templates/flags/bs.svg';
import bhFlag from '../templates/flags/bh.svg';
import bdFlag from '../templates/flags/bd.svg';
import bbFlag from '../templates/flags/bb.svg';
import byFlag from '../templates/flags/by.svg';
import beFlag from '../templates/flags/be.svg';
import bzFlag from '../templates/flags/bz.svg';
import bjFlag from '../templates/flags/bj.svg';
import bmFlag from '../templates/flags/bm.svg';
import btFlag from '../templates/flags/bt.svg';
import boFlag from '../templates/flags/bo.svg';
import baFlag from '../templates/flags/ba.svg';
import bwFlag from '../templates/flags/bw.svg';
import brFlag from '../templates/flags/br.svg';
import ioFlag from '../templates/flags/io.svg';
import vgFlag from '../templates/flags/vg.svg';
import bnFlag from '../templates/flags/bn.svg';
import bgFlag from '../templates/flags/bg.svg';
import bfFlag from '../templates/flags/bf.svg';
import biFlag from '../templates/flags/bi.svg';
import khFlag from '../templates/flags/kh.svg';
import cmFlag from '../templates/flags/cm.svg';
import caFlag from '../templates/flags/ca.svg';
import cvFlag from '../templates/flags/cv.svg';
import kyFlag from '../templates/flags/ky.svg';
import cfFlag from '../templates/flags/cf.svg';
import tdFlag from '../templates/flags/td.svg';
import clFlag from '../templates/flags/cl.svg';
import cnFlag from '../templates/flags/cn.svg';
import cxFlag from '../templates/flags/cx.svg';
import ccFlag from '../templates/flags/cc.svg';
import coFlag from '../templates/flags/co.svg';
import kmFlag from '../templates/flags/km.svg';
import ckFlag from '../templates/flags/ck.svg';
import crFlag from '../templates/flags/cr.svg';
import hrFlag from '../templates/flags/hr.svg';
import cuFlag from '../templates/flags/cu.svg';
import cwFlag from '../templates/flags/cw.svg';
import cyFlag from '../templates/flags/cy.svg';
import czFlag from '../templates/flags/cz.svg';
import cdFlag from '../templates/flags/cd.svg';
import dkFlag from '../templates/flags/dk.svg';
import djFlag from '../templates/flags/dj.svg';
import dmFlag from '../templates/flags/dm.svg';
import doFlag from '../templates/flags/do.svg';
import tlFlag from '../templates/flags/tl.svg';
import ecFlag from '../templates/flags/ec.svg';
import egFlag from '../templates/flags/eg.svg';
import svFlag from '../templates/flags/sv.svg';
import gqFlag from '../templates/flags/gq.svg';
import erFlag from '../templates/flags/er.svg';
import eeFlag from '../templates/flags/ee.svg';
import etFlag from '../templates/flags/et.svg';
import fkFlag from '../templates/flags/fk.svg';
import foFlag from '../templates/flags/fo.svg';
import fjFlag from '../templates/flags/fj.svg';
import fiFlag from '../templates/flags/fi.svg';
import frFlag from '../templates/flags/fr.svg';
import pfFlag from '../templates/flags/pf.svg';
import gaFlag from '../templates/flags/ga.svg';
import gmFlag from '../templates/flags/gm.svg';
import geFlag from '../templates/flags/ge.svg';
import deFlag from '../templates/flags/de.svg';
import ghFlag from '../templates/flags/gh.svg';
import giFlag from '../templates/flags/gi.svg';
import grFlag from '../templates/flags/gr.svg';
import glFlag from '../templates/flags/gl.svg';
import gdFlag from '../templates/flags/gd.svg';
import guFlag from '../templates/flags/gu.svg';
import gtFlag from '../templates/flags/gt.svg';
import ggFlag from '../templates/flags/gg.svg';
import gnFlag from '../templates/flags/gn.svg';
import gwFlag from '../templates/flags/gw.svg';
import gyFlag from '../templates/flags/gy.svg';
import htFlag from '../templates/flags/ht.svg';
import hnFlag from '../templates/flags/hn.svg';
import hkFlag from '../templates/flags/hk.svg';
import huFlag from '../templates/flags/hu.svg';
import isFlag from '../templates/flags/is.svg';
import inFlag from '../templates/flags/in.svg';
import idFlag from '../templates/flags/id.svg';
import irFlag from '../templates/flags/ir.svg';
import iqFlag from '../templates/flags/iq.svg';
import ieFlag from '../templates/flags/ie.svg';
import imFlag from '../templates/flags/im.svg';
import ilFlag from '../templates/flags/il.svg';
import itFlag from '../templates/flags/it.svg';
import ciFlag from '../templates/flags/ci.svg';
import jmFlag from '../templates/flags/jm.svg';
import jpFlag from '../templates/flags/jp.svg';
import jeFlag from '../templates/flags/je.svg';
import joFlag from '../templates/flags/jo.svg';
import kzFlag from '../templates/flags/kz.svg';
import keFlag from '../templates/flags/ke.svg';
import kiFlag from '../templates/flags/ki.svg';
import xkFlag from '../templates/flags/xk.svg';
import kwFlag from '../templates/flags/kw.svg';
import kgFlag from '../templates/flags/kg.svg';
import laFlag from '../templates/flags/la.svg';
import lvFlag from '../templates/flags/lv.svg';
import lbFlag from '../templates/flags/lb.svg';
import lsFlag from '../templates/flags/ls.svg';
import lrFlag from '../templates/flags/lr.svg';
import lyFlag from '../templates/flags/ly.svg';
import liFlag from '../templates/flags/li.svg';
import ltFlag from '../templates/flags/lt.svg';
import luFlag from '../templates/flags/lu.svg';
import moFlag from '../templates/flags/mo.svg';
import mkFlag from '../templates/flags/mk.svg';
import mgFlag from '../templates/flags/mg.svg';
import mwFlag from '../templates/flags/mw.svg';
import myFlag from '../templates/flags/my.svg';
import mvFlag from '../templates/flags/mv.svg';
import mlFlag from '../templates/flags/ml.svg';
import mtFlag from '../templates/flags/mt.svg';
import mhFlag from '../templates/flags/mh.svg';
import mrFlag from '../templates/flags/mr.svg';
import muFlag from '../templates/flags/mu.svg';
import ytFlag from '../templates/flags/yt.svg';
import mxFlag from '../templates/flags/mx.svg';
import fmFlag from '../templates/flags/fm.svg';
import mdFlag from '../templates/flags/md.svg';
import mcFlag from '../templates/flags/mc.svg';
import mnFlag from '../templates/flags/mn.svg';
import meFlag from '../templates/flags/me.svg';
import msFlag from '../templates/flags/ms.svg';
import maFlag from '../templates/flags/ma.svg';
import mzFlag from '../templates/flags/mz.svg';
import mmFlag from '../templates/flags/mm.svg';
import naFlag from '../templates/flags/na.svg';
import nrFlag from '../templates/flags/nr.svg';
import npFlag from '../templates/flags/np.svg';
import nlFlag from '../templates/flags/nl.svg';
import anFlag from '../templates/flags/nl.svg';
import ncFlag from '../templates/flags/nc.svg';
import nzFlag from '../templates/flags/nz.svg';
import niFlag from '../templates/flags/ni.svg';
import neFlag from '../templates/flags/ne.svg';
import ngFlag from '../templates/flags/ng.svg';
import nuFlag from '../templates/flags/nu.svg';
import kpFlag from '../templates/flags/kp.svg';
import mpFlag from '../templates/flags/mp.svg';
import noFlag from '../templates/flags/no.svg';
import omFlag from '../templates/flags/om.svg';
import pkFlag from '../templates/flags/pk.svg';
import pwFlag from '../templates/flags/pw.svg';
import psFlag from '../templates/flags/ps.svg';
import paFlag from '../templates/flags/pa.svg';
import pgFlag from '../templates/flags/pg.svg';
import pyFlag from '../templates/flags/py.svg';
import peFlag from '../templates/flags/pe.svg';
import phFlag from '../templates/flags/ph.svg';
import pnFlag from '../templates/flags/pn.svg';
import plFlag from '../templates/flags/pl.svg';
import ptFlag from '../templates/flags/pt.svg';
import prFlag from '../templates/flags/pr.svg';
import qaFlag from '../templates/flags/qa.svg';
import cgFlag from '../templates/flags/cg.svg';
import reFlag from '../templates/flags/re.svg';
import roFlag from '../templates/flags/ro.svg';
import ruFlag from '../templates/flags/ru.svg';
import rwFlag from '../templates/flags/rw.svg';
import blFlag from '../templates/flags/bl.svg';
import shFlag from '../templates/flags/sh.svg';
import knFlag from '../templates/flags/kn.svg';
import lcFlag from '../templates/flags/lc.svg';
import mfFlag from '../templates/flags/mf.svg';
import pmFlag from '../templates/flags/pm.svg';
import vcFlag from '../templates/flags/vc.svg';
import wsFlag from '../templates/flags/ws.svg';
import smFlag from '../templates/flags/sm.svg';
import stFlag from '../templates/flags/st.svg';
import saFlag from '../templates/flags/sa.svg';
import snFlag from '../templates/flags/sn.svg';
import rsFlag from '../templates/flags/rs.svg';
import scFlag from '../templates/flags/sc.svg';
import slFlag from '../templates/flags/sl.svg';
import sgFlag from '../templates/flags/sg.svg';
import sxFlag from '../templates/flags/sx.svg';
import skFlag from '../templates/flags/sk.svg';
import siFlag from '../templates/flags/si.svg';
import sbFlag from '../templates/flags/sb.svg';
import soFlag from '../templates/flags/so.svg';
import zaFlag from '../templates/flags/za.svg';
import krFlag from '../templates/flags/kr.svg';
import ssFlag from '../templates/flags/ss.svg';
import esFlag from '../templates/flags/es.svg';
import lkFlag from '../templates/flags/lk.svg';
import sdFlag from '../templates/flags/sd.svg';
import srFlag from '../templates/flags/sr.svg';
import sjFlag from '../templates/flags/sj.svg';
import szFlag from '../templates/flags/sz.svg';
import seFlag from '../templates/flags/se.svg';
import chFlag from '../templates/flags/ch.svg';
import syFlag from '../templates/flags/sy.svg';
import twFlag from '../templates/flags/tw.svg';
import tjFlag from '../templates/flags/tj.svg';
import tzFlag from '../templates/flags/tz.svg';
import thFlag from '../templates/flags/th.svg';
import tgFlag from '../templates/flags/tg.svg';
import tkFlag from '../templates/flags/tk.svg';
import toFlag from '../templates/flags/to.svg';
import ttFlag from '../templates/flags/tt.svg';
import tnFlag from '../templates/flags/tn.svg';
import trFlag from '../templates/flags/tr.svg';
import tmFlag from '../templates/flags/tm.svg';
import tcFlag from '../templates/flags/tc.svg';
import tvFlag from '../templates/flags/tv.svg';
import viFlag from '../templates/flags/vi.svg';
import ugFlag from '../templates/flags/ug.svg';
import uaFlag from '../templates/flags/ua.svg';
import aeFlag from '../templates/flags/ae.svg';
import gbFlag from '../templates/flags/gb.svg';
import usFlag from '../templates/flags/us.svg';
import uyFlag from '../templates/flags/uy.svg';
import uzFlag from '../templates/flags/uz.svg';
import vuFlag from '../templates/flags/vu.svg';
import vaFlag from '../templates/flags/va.svg';
import veFlag from '../templates/flags/ve.svg';
import vnFlag from '../templates/flags/vn.svg';
import wfFlag from '../templates/flags/wf.svg';
import ehFlag from '../templates/flags/eh.svg';
import yeFlag from '../templates/flags/ye.svg';
import zmFlag from '../templates/flags/zm.svg';
import zwFlag from '../templates/flags/zw.svg';


// Extensions.
import PhoneExtension from './extensions/fields/PhoneExtension.js';
import PhoneCheckExtension from "./extensions/checks/PhoneCheckExtension";
import SessionExtension from "./extensions/session/SessionExtension";
import CountryCodeExtension from "./extensions/fields/CountryCodeExtension";

function EnderecoPhone(customConfig={}) {

    // Get base object, that will be extended.
    var base = new EnderecoBase();
    base.type = 'phone';
    base.name = 'phoneservices';
    base.numberType = 'general';
    base._flagContainerDom = undefined;
    // Override config.
    base.config = merge(base.config, customConfig);

    // This source: 
    base.mapping = [
        {
            "iso2":"DE",
            "code":"+49",
            "flag":deFlag
        },
        {
            "iso2":"AT",
            "code":"+43",
            "flag":atFlag
        },
        {
            "iso2":"CH",
            "code":"+41",
            "flag":chFlag
        },
        {
            "iso2":"AF",
            "code":"+93",
            "flag":afFlag
        },
        {
            "iso2":"AL",
            "code":"+355",
            "flag":alFlag
        },
        {
            "iso2":"DZ",
            "code":"+213",
            "flag":dzFlag
        },
        {
            "iso2":"AS",
            "code":"+1-684",
            "flag":asFlag
        },
        {
            "iso2":"AD",
            "code":"+376",
            "flag":adFlag
        },
        {
            "iso2":"AO",
            "code":"+244",
            "flag":aoFlag
        },
        {
            "iso2":"AI",
            "code":"+1-264",
            "flag":aiFlag
        },
        {
            "iso2":"AQ",
            "code":"+672",
            "flag":aqFlag
        },
        {
            "iso2":"AG",
            "code":"+1-268",
            "flag":agFlag
        },
        {
            "iso2":"AR",
            "code":"+54",
            "flag":arFlag
        },
        {
            "iso2":"AM",
            "code":"+374",
            "flag":amFlag
        },
        {
            "iso2":"AW",
            "code":"+297",
            "flag":awFlag
        },
        {
            "iso2":"AU",
            "code":"+61",
            "flag":auFlag
        },
        {
            "iso2":"AZ",
            "code":"+994",
            "flag":azFlag
        },
        {
            "iso2":"BS",
            "code":"+1-242",
            "flag":bsFlag
        },
        {
            "iso2":"BH",
            "code":"+973",
            "flag":bhFlag
        },
        {
            "iso2":"BD",
            "code":"+880",
            "flag":bdFlag
        },
        {
            "iso2":"BB",
            "code":"+1-246",
            "flag":bbFlag
        },
        {
            "iso2":"BY",
            "code":"+375",
            "flag":byFlag
        },
        {
            "iso2":"BE",
            "code":"+32",
            "flag":beFlag
        },
        {
            "iso2":"BZ",
            "code":"+501",
            "flag":bzFlag
        },
        {
            "iso2":"BJ",
            "code":"+229",
            "flag":bjFlag
        },
        {
            "iso2":"BM",
            "code":"+1-441",
            "flag":bmFlag
        },
        {
            "iso2":"BT",
            "code":"+975",
            "flag":btFlag
        },
        {
            "iso2":"BO",
            "code":"+591",
            "flag":boFlag
        },
        {
            "iso2":"BA",
            "code":"+387",
            "flag":baFlag
        },
        {
            "iso2":"BW",
            "code":"+267",
            "flag":bwFlag
        },
        {
            "iso2":"BR",
            "code":"+55",
            "flag":brFlag
        },
        {
            "iso2":"IO",
            "code":"+246",
            "flag":ioFlag
        },
        {
            "iso2":"VG",
            "code":"+1-284",
            "flag":vgFlag
        },
        {
            "iso2":"BN",
            "code":"+673",
            "flag":bnFlag
        },
        {
            "iso2":"BG",
            "code":"+359",
            "flag":bgFlag
        },
        {
            "iso2":"BF",
            "code":"+226",
            "flag":bfFlag
        },
        {
            "iso2":"BI",
            "code":"+257",
            "flag":biFlag
        },
        {
            "iso2":"KH",
            "code":"+855",
            "flag":khFlag
        },
        {
            "iso2":"CM",
            "code":"+237",
            "flag":cmFlag
        },
        {
            "iso2":"CA",
            "code":"+1",
            "flag":caFlag
        },
        {
            "iso2":"CV",
            "code":"+238",
            "flag":cvFlag
        },
        {
            "iso2":"KY",
            "code":"+1-345",
            "flag":kyFlag
        },
        {
            "iso2":"CF",
            "code":"+236",
            "flag":cfFlag
        },
        {
            "iso2":"TD",
            "code":"+235",
            "flag":tdFlag
        },
        {
            "iso2":"CL",
            "code":"+56",
            "flag":clFlag
        },
        {
            "iso2":"CN",
            "code":"+86",
            "flag":cnFlag
        },
        {
            "iso2":"CX",
            "code":"+61",
            "flag":cxFlag
        },
        {
            "iso2":"CC",
            "code":"+61",
            "flag":ccFlag
        },
        {
            "iso2":"CO",
            "code":"+57",
            "flag":coFlag
        },
        {
            "iso2":"KM",
            "code":"+269",
            "flag":kmFlag
        },
        {
            "iso2":"CK",
            "code":"+682",
            "flag":ckFlag
        },
        {
            "iso2":"CR",
            "code":"+506",
            "flag":crFlag
        },
        {
            "iso2":"HR",
            "code":"+385",
            "flag":hrFlag
        },
        {
            "iso2":"CU",
            "code":"+53",
            "flag":cuFlag
        },
        {
            "iso2":"CW",
            "code":"+599",
            "flag":cwFlag
        },
        {
            "iso2":"CY",
            "code":"+357",
            "flag":cyFlag
        },
        {
            "iso2":"CZ",
            "code":"+420",
            "flag":czFlag
        },
        {
            "iso2":"CD",
            "code":"+243",
            "flag":cdFlag
        },
        {
            "iso2":"DK",
            "code":"+45",
            "flag":dkFlag
        },
        {
            "iso2":"DJ",
            "code":"+253",
            "flag":djFlag
        },
        {
            "iso2":"DM",
            "code":"+1-767",
            "flag":dmFlag
        },
        {
            "iso2":"DO",
            "code":"+1-809",
            "flag":doFlag
        },
        {
            "iso2":"DO",
            "code":"+ 1-829",
            "flag":doFlag
        },
        {
            "iso2":"DO",
            "code":"+ 1-849",
            "flag":doFlag
        },
        {
            "iso2":"TL",
            "code":"+670",
            "flag":tlFlag
        },
        {
            "iso2":"EC",
            "code":"+593",
            "flag":ecFlag
        },
        {
            "iso2":"EG",
            "code":"+20",
            "flag":egFlag
        },
        {
            "iso2":"SV",
            "code":"+503",
            "flag":svFlag
        },
        {
            "iso2":"GQ",
            "code":"+240",
            "flag":gqFlag
        },
        {
            "iso2":"ER",
            "code":"+291",
            "flag":erFlag
        },
        {
            "iso2":"EE",
            "code":"+372",
            "flag":eeFlag
        },
        {
            "iso2":"ET",
            "code":"+251",
            "flag":etFlag
        },
        {
            "iso2":"FK",
            "code":"+500",
            "flag":fkFlag
        },
        {
            "iso2":"FO",
            "code":"+298",
            "flag":foFlag
        },
        {
            "iso2":"FJ",
            "code":"+679",
            "flag":fjFlag
        },
        {
            "iso2":"FI",
            "code":"+358",
            "flag":fiFlag
        },
        {
            "iso2":"FR",
            "code":"+33",
            "flag":frFlag
        },
        {
            "iso2":"PF",
            "code":"+689",
            "flag":pfFlag
        },
        {
            "iso2":"GA",
            "code":"+241",
            "flag":gaFlag
        },
        {
            "iso2":"GM",
            "code":"+220",
            "flag":gmFlag
        },
        {
            "iso2":"GE",
            "code":"+995",
            "flag":geFlag
        },

        {
            "iso2":"GH",
            "code":"+233",
            "flag":ghFlag
        },
        {
            "iso2":"GI",
            "code":"+350",
            "flag":giFlag
        },
        {
            "iso2":"GR",
            "code":"+30",
            "flag":grFlag
        },
        {
            "iso2":"GL",
            "code":"+299",
            "flag":glFlag
        },
        {
            "iso2":"GD",
            "code":"+1-473",
            "flag":gdFlag
        },
        {
            "iso2":"GU",
            "code":"+1-671",
            "flag":guFlag
        },
        {
            "iso2":"GT",
            "code":"+502",
            "flag":gtFlag
        },
        {
            "iso2":"GG",
            "code":"+44-1481",
            "flag":ggFlag
        },
        {
            "iso2":"GN",
            "code":"+224",
            "flag":gnFlag
        },
        {
            "iso2":"GW",
            "code":"+245",
            "flag":gwFlag
        },
        {
            "iso2":"GY",
            "code":"+592",
            "flag":gyFlag
        },
        {
            "iso2":"HT",
            "code":"+509",
            "flag":htFlag
        },
        {
            "iso2":"HN",
            "code":"+504",
            "flag":hnFlag
        },
        {
            "iso2":"HK",
            "code":"+852",
            "flag":hkFlag
        },
        {
            "iso2":"HU",
            "code":"+36",
            "flag":huFlag
        },
        {
            "iso2":"IS",
            "code":"+354",
            "flag":isFlag
        },
        {
            "iso2":"IN",
            "code":"+91",
            "flag":inFlag
        },
        {
            "iso2":"ID",
            "code":"+62",
            "flag":idFlag
        },
        {
            "iso2":"IR",
            "code":"+98",
            "flag":irFlag
        },
        {
            "iso2":"IQ",
            "code":"+964",
            "flag":iqFlag
        },
        {
            "iso2":"IE",
            "code":"+353",
            "flag":ieFlag
        },
        {
            "iso2":"IM",
            "code":"+44-1624",
            "flag":imFlag
        },
        {
            "iso2":"IL",
            "code":"+972",
            "flag":ilFlag
        },
        {
            "iso2":"IT",
            "code":"+39",
            "flag":itFlag
        },
        {
            "iso2":"CI",
            "code":"+225",
            "flag":ciFlag
        },
        {
            "iso2":"JM",
            "code":"+1-876",
            "flag":jmFlag
        },
        {
            "iso2":"JP",
            "code":"+81",
            "flag":jpFlag
        },
        {
            "iso2":"JE",
            "code":"+44-1534",
            "flag":jeFlag
        },
        {
            "iso2":"JO",
            "code":"+962",
            "flag":joFlag
        },
        {
            "iso2":"KZ",
            "code":"+7",
            "flag":kzFlag
        },
        {
            "iso2":"KE",
            "code":"+254",
            "flag":keFlag
        },
        {
            "iso2":"KI",
            "code":"+686",
            "flag":kiFlag
        },
        {
            "iso2":"XK",
            "code":"+383",
            "flag":xkFlag
        },
        {
            "iso2":"KW",
            "code":"+965",
            "flag":kwFlag
        },
        {
            "iso2":"KG",
            "code":"+996",
            "flag":kgFlag
        },
        {
            "iso2":"LA",
            "code":"+856",
            "flag":laFlag
        },
        {
            "iso2":"LV",
            "code":"+371",
            "flag":lvFlag
        },
        {
            "iso2":"LB",
            "code":"+961",
            "flag":lbFlag
        },
        {
            "iso2":"LS",
            "code":"+266",
            "flag":lsFlag
        },
        {
            "iso2":"LR",
            "code":"+231",
            "flag":lrFlag
        },
        {
            "iso2":"LY",
            "code":"+218",
            "flag":lyFlag
        },
        {
            "iso2":"LI",
            "code":"+423",
            "flag":liFlag
        },
        {
            "iso2":"LT",
            "code":"+370",
            "flag":ltFlag
        },
        {
            "iso2":"LU",
            "code":"+352",
            "flag":luFlag
        },
        {
            "iso2":"MO",
            "code":"+853",
            "flag":moFlag
        },
        {
            "iso2":"MK",
            "code":"+389",
            "flag":mkFlag
        },
        {
            "iso2":"MG",
            "code":"+261",
            "flag":mgFlag
        },
        {
            "iso2":"MW",
            "code":"+265",
            "flag":mwFlag
        },
        {
            "iso2":"MY",
            "code":"+60",
            "flag":myFlag
        },
        {
            "iso2":"MV",
            "code":"+960",
            "flag":mvFlag
        },
        {
            "iso2":"ML",
            "code":"+223",
            "flag":mlFlag
        },
        {
            "iso2":"MT",
            "code":"+356",
            "flag":mtFlag
        },
        {
            "iso2":"MH",
            "code":"+692",
            "flag":mhFlag
        },
        {
            "iso2":"MR",
            "code":"+222",
            "flag":mrFlag
        },
        {
            "iso2":"MU",
            "code":"+230",
            "flag":muFlag
        },
        {
            "iso2":"YT",
            "code":"+262",
            "flag":ytFlag
        },
        {
            "iso2":"MX",
            "code":"+52",
            "flag":mxFlag
        },
        {
            "iso2":"FM",
            "code":"+691",
            "flag":fmFlag
        },
        {
            "iso2":"MD",
            "code":"+373",
            "flag":mdFlag
        },
        {
            "iso2":"MC",
            "code":"+377",
            "flag":mcFlag
        },
        {
            "iso2":"MN",
            "code":"+976",
            "flag":mnFlag
        },
        {
            "iso2":"ME",
            "code":"+382",
            "flag":meFlag
        },
        {
            "iso2":"MS",
            "code":"+1-664",
            "flag":msFlag
        },
        {
            "iso2":"MA",
            "code":"+212",
            "flag":maFlag
        },
        {
            "iso2":"MZ",
            "code":"+258",
            "flag":mzFlag
        },
        {
            "iso2":"MM",
            "code":"+95",
            "flag":mmFlag
        },
        {
            "iso2":"NA",
            "code":"+264",
            "flag":naFlag
        },
        {
            "iso2":"NR",
            "code":"+674",
            "flag":nrFlag
        },
        {
            "iso2":"NP",
            "code":"+977",
            "flag":npFlag
        },
        {
            "iso2":"NL",
            "code":"+31",
            "flag":nlFlag
        },
        {
            "iso2":"AN",
            "code":"+599",
            "flag":anFlag
        },
        {
            "iso2":"NC",
            "code":"+687",
            "flag":ncFlag
        },
        {
            "iso2":"NZ",
            "code":"+64",
            "flag":nzFlag
        },
        {
            "iso2":"NI",
            "code":"+505",
            "flag":niFlag
        },
        {
            "iso2":"NE",
            "code":"+227",
            "flag":neFlag
        },
        {
            "iso2":"NG",
            "code":"+234",
            "flag":ngFlag
        },
        {
            "iso2":"NU",
            "code":"+683",
            "flag":nuFlag
        },
        {
            "iso2":"KP",
            "code":"+850",
            "flag":kpFlag
        },
        {
            "iso2":"MP",
            "code":"+1-670",
            "flag":mpFlag
        },
        {
            "iso2":"NO",
            "code":"+47",
            "flag":noFlag
        },
        {
            "iso2":"OM",
            "code":"+968",
            "flag":omFlag
        },
        {
            "iso2":"PK",
            "code":"+92",
            "flag":pkFlag
        },
        {
            "iso2":"PW",
            "code":"+680",
            "flag":pwFlag
        },
        {
            "iso2":"PS",
            "code":"+970",
            "flag":psFlag
        },
        {
            "iso2":"PA",
            "code":"+507",
            "flag":paFlag
        },
        {
            "iso2":"PG",
            "code":"+675",
            "flag":pgFlag
        },
        {
            "iso2":"PY",
            "code":"+595",
            "flag":pyFlag
        },
        {
            "iso2":"PE",
            "code":"+51",
            "flag":peFlag
        },
        {
            "iso2":"PH",
            "code":"+63",
            "flag":phFlag
        },
        {
            "iso2":"PN",
            "code":"+64",
            "flag":pnFlag
        },
        {
            "iso2":"PL",
            "code":"+48",
            "flag":plFlag
        },
        {
            "iso2":"PT",
            "code":"+351",
            "flag":ptFlag
        },
        {
            "iso2":"PR",
            "code":"+1-787",
            "flag":prFlag
        },
        {
            "iso2":"PR",
            "code":"+ 1-939",
            "flag":prFlag
        },
        {
            "iso2":"QA",
            "code":"+974",
            "flag":qaFlag
        },
        {
            "iso2":"CG",
            "code":"+242",
            "flag":cgFlag
        },
        {
            "iso2":"RE",
            "code":"+262",
            "flag":reFlag
        },
        {
            "iso2":"RO",
            "code":"+40",
            "flag":roFlag
        },
        {
            "iso2":"RU",
            "code":"+7",
            "flag":ruFlag
        },
        {
            "iso2":"RW",
            "code":"+250",
            "flag":rwFlag
        },
        {
            "iso2":"BL",
            "code":"+590",
            "flag":blFlag
        },
        {
            "iso2":"SH",
            "code":"+290",
            "flag":shFlag
        },
        {
            "iso2":"KN",
            "code":"+1-869",
            "flag":knFlag
        },
        {
            "iso2":"LC",
            "code":"+1-758",
            "flag":lcFlag
        },
        {
            "iso2":"MF",
            "code":"+590",
            "flag":mfFlag
        },
        {
            "iso2":"PM",
            "code":"+508",
            "flag":pmFlag
        },
        {
            "iso2":"VC",
            "code":"+1-784",
            "flag":vcFlag
        },
        {
            "iso2":"WS",
            "code":"+685",
            "flag":wsFlag
        },
        {
            "iso2":"SM",
            "code":"+378",
            "flag":smFlag
        },
        {
            "iso2":"ST",
            "code":"+239",
            "flag":stFlag
        },
        {
            "iso2":"SA",
            "code":"+966",
            "flag":saFlag
        },
        {
            "iso2":"SN",
            "code":"+221",
            "flag":snFlag
        },
        {
            "iso2":"RS",
            "code":"+381",
            "flag":rsFlag
        },
        {
            "iso2":"SC",
            "code":"+248",
            "flag":scFlag
        },
        {
            "iso2":"SL",
            "code":"+232",
            "flag":slFlag
        },
        {
            "iso2":"SG",
            "code":"+65",
            "flag":sgFlag
        },
        {
            "iso2":"SX",
            "code":"+1-721",
            "flag":sxFlag
        },
        {
            "iso2":"SK",
            "code":"+421",
            "flag":skFlag
        },
        {
            "iso2":"SI",
            "code":"+386",
            "flag":siFlag
        },
        {
            "iso2":"SB",
            "code":"+677",
            "flag":sbFlag
        },
        {
            "iso2":"SO",
            "code":"+252",
            "flag":soFlag
        },
        {
            "iso2":"ZA",
            "code":"+27",
            "flag":zaFlag
        },
        {
            "iso2":"KR",
            "code":"+82",
            "flag":krFlag
        },
        {
            "iso2":"SS",
            "code":"+211",
            "flag":ssFlag
        },
        {
            "iso2":"ES",
            "code":"+34",
            "flag":esFlag
        },
        {
            "iso2":"LK",
            "code":"+94",
            "flag":lkFlag
        },
        {
            "iso2":"SD",
            "code":"+249",
            "flag":sdFlag
        },
        {
            "iso2":"SR",
            "code":"+597",
            "flag":srFlag
        },
        {
            "iso2":"SJ",
            "code":"+47",
            "flag":sjFlag
        },
        {
            "iso2":"SZ",
            "code":"+268",
            "flag":szFlag
        },
        {
            "iso2":"SE",
            "code":"+46",
            "flag":seFlag
        },
        {
            "iso2":"SY",
            "code":"+963",
            "flag":syFlag
        },
        {
            "iso2":"TW",
            "code":"+886",
            "flag":twFlag
        },
        {
            "iso2":"TJ",
            "code":"+992",
            "flag":tjFlag
        },
        {
            "iso2":"TZ",
            "code":"+255",
            "flag":tzFlag
        },
        {
            "iso2":"TH",
            "code":"+66",
            "flag":thFlag
        },
        {
            "iso2":"TG",
            "code":"+228",
            "flag":tgFlag
        },
        {
            "iso2":"TK",
            "code":"+690",
            "flag":tkFlag
        },
        {
            "iso2":"TO",
            "code":"+676",
            "flag":toFlag
        },
        {
            "iso2":"TT",
            "code":"+1-868",
            "flag":ttFlag
        },
        {
            "iso2":"TN",
            "code":"+216",
            "flag":tnFlag
        },
        {
            "iso2":"TR",
            "code":"+90",
            "flag":trFlag
        },
        {
            "iso2":"TM",
            "code":"+993",
            "flag":tmFlag
        },
        {
            "iso2":"TC",
            "code":"+1-649",
            "flag":tcFlag
        },
        {
            "iso2":"TV",
            "code":"+688",
            "flag":tvFlag
        },
        {
            "iso2":"VI",
            "code":"+1-340",
            "flag":viFlag
        },
        {
            "iso2":"UG",
            "code":"+256",
            "flag":ugFlag
        },
        {
            "iso2":"UA",
            "code":"+380",
            "flag":uaFlag
        },
        {
            "iso2":"AE",
            "code":"+971",
            "flag":aeFlag
        },
        {
            "iso2":"GB",
            "code":"+44",
            "flag":gbFlag
        },
        {
            "iso2":"US",
            "code":"+1",
            "flag":usFlag
        },
        {
            "iso2":"UY",
            "code":"+598",
            "flag":uyFlag
        },
        {
            "iso2":"UZ",
            "code":"+998",
            "flag":uzFlag
        },
        {
            "iso2":"VU",
            "code":"+678",
            "flag":vuFlag
        },
        {
            "iso2":"VA",
            "code":"+379",
            "flag":vaFlag
        },
        {
            "iso2":"VE",
            "code":"+58",
            "flag":veFlag
        },
        {
            "iso2":"VN",
            "code":"+84",
            "flag":vnFlag
        },
        {
            "iso2":"WF",
            "code":"+681",
            "flag":wfFlag
        },
        {
            "iso2":"EH",
            "code":"+212",
            "flag":ehFlag
        },
        {
            "iso2":"YE",
            "code":"+967",
            "flag":yeFlag
        },
        {
            "iso2":"ZM",
            "code":"+260",
            "flag":zmFlag
        },
        {
            "iso2":"ZW",
            "code":"+263",
            "flag":zwFlag
        }
    ];

    // Add extensions.
    base.extensions = [
        PhoneExtension,
        PhoneCheckExtension,
        CountryCodeExtension,
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
                    base.currePrefix = queryStr;
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
            base.currePrefix = '';
        }

        return returnHtml;
    }

    base.currePrefix = false;

    base.setPrefix = function(input, prefix) {
        if (base.currePrefix !== prefix) {
            var inputValue = input.value;
            if ("" !== base.currePrefix) {
                inputValue = inputValue.substring(base.currePrefix.length);
            }

            input.value = prefix + inputValue;

            if (!!window.jQuery && !!window.jQuery.trigger) {
                window.jQuery(input).trigger('change').trigger('blur');
            } else if (!!window.$ && !!window.$.trigger) {
                window.$(input).trigger('change').trigger('blue');
            } else {
                input.dispatchEvent(new Event('change'));
                input.dispatchEvent(new Event('blur'));
            }
        }
    }

    // Render flags method.
    base.renderFlags = function() {
        if (
            !!window.EnderecoIntegrator.config.ux.showPhoneFlag &&
            ['E164','INTERNATIONAL'].includes(window.EnderecoIntegrator.config.phoneFormat)
        ) {
            base._subscribers.phone.forEach( function(subscriber) {
                var DOMElement = subscriber.object;
                var flagsHTML = flagButtonHTML;

                var dropdownHTML = Mustache.render(
                    phoneDropdownHTML,
                    {
                        "countries": base.mapping
                    }
                );

                var heightOfInput = 0;
                var heightOfFlag = 0;
                var offsetFromParent = 0;
                var flagElement, dropdownElement;
                var topOffset = 0;
                var dropdownTopOffset = 0;
                var leftOffset = 0;
                var dividerSize = 0;
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
                    dividerSize = 0.80;
                    if (heightOfInput > 30) {
                        dividerSize = 0.5;
                    }
                    heightOfFlag = heightOfInput * dividerSize;
                    topOffset = offsetFromParent + ((heightOfInput - heightOfFlag) / 2);
                    leftOffset = ((heightOfInput - heightOfFlag) / 2);
                    dropdownTopOffset = topOffset+heightOfInput;

                    flagElement.style.top = `${topOffset}px`;
                    flagElement.style.left = `${leftOffset}px`;

                    flagElement.querySelector('.endereco-flag').style.height = `${heightOfFlag}px`;
                    flagElement.querySelector('.endereco-flag').style.width = `${heightOfFlag}px`;

                    widthOfFlag = flagElement.offsetWidth + ((heightOfInput - heightOfFlag) / 2);
                    DOMElement.style.paddingLeft= `${widthOfFlag}px`;

                    // Add input listener.
                    var $oldValue = DOMElement.value;
                    setInterval( function() {
                        var $newValue = DOMElement.value;
                        if ($oldValue !== $newValue) {
                            $oldValue = $newValue;
                            flagElement.querySelector('.endereco-flag').innerHTML = base.getFlagHTML(
                                DOMElement.value.substring(0, 10)
                            );
                        }
                    }, 1);

                    // Set default value.
                    flagElement.querySelector('.endereco-flag').innerHTML = base.getFlagHTML(
                        DOMElement.value.substring(0, 10)
                    );

                    // Add autocomplete für diverse codes.
                    DOMElement.insertAdjacentHTML('afterend',
                        dropdownHTML);
                    dropdownElement = DOMElement.parentElement.querySelector('.endereco-flag-dropdown');
                    dropdownElement.style.top = `${dropdownTopOffset}px`;
                    document.querySelector('body').addEventListener('click', function(e) {
                        if (!dropdownElement.contains(e.target)) {
                            dropdownElement.classList.add("endereco-hidden");
                        }
                    });

                    // Add click listener to big flag.
                    flagElement.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        var dropdownDOM = this.parentElement.querySelector('.endereco-flag-dropdown');
                        dropdownDOM.classList.toggle("endereco-hidden");
                        return false;
                    });

                    // Add click listener to dropdown elements.
                    dropdownElement.querySelectorAll('.endereco-flag-dropdown-element').forEach(function(element) {
                        element.addEventListener('click', function(e) {
                            base.setPrefix(DOMElement, this.getAttribute("data-code"));
                            flagElement.querySelector('.endereco-flag').innerHTML = base.getFlagHTML(
                                DOMElement.value.substring(0, 10)
                            );
                            dropdownElement.classList.add("endereco-hidden");
                        })
                    });
                }

            });
        }
    }

    return base;
}

export default EnderecoPhone

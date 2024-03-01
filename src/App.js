import "./App.css";
import { useEffect, useRef } from "react";
import ReactDOMServer from 'react-dom/server';
import useState from "react-usestateref";
import {
  useNavigate, redirect, useLoaderData, useLocation
} from "react-router-dom";
import { Stack, Slide, Box, Typography, FormLabel, FormControl, FormControlLabel, FormGroup, TextField, RadioGroup, Radio, Grid, Paper, Button, styled, Checkbox } from "@mui/material";
import React from "react";
import { backendURL, buttonReenableTimeout, categoryChangeExtraTimeout, gdprControllerName, gdprControllerEmail } from "./config.js";
import Cookies from "js-cookie";
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'
import { useSpring, useSprings, animated } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { Helmet } from "react-helmet";
import ProgressBar from "@ramonak/react-progress-bar";
import Marquee from "react-fast-marquee";
import intl from 'react-intl-universal';
import enGB from './locales/en-GB.json';
import nlNL from './locales/nl-NL.json';

const maximumRatingsPerCategory = 20;
const localeChoices = {
  'en-GB': {
    shortname: 'EN',
    json: enGB,
    longname: 'English/GB',
    region: 'Great Britain',
    enabled: true
  },
  'nl-NL': {
    shortname: 'NL',
    json: nlNL,
    longname: 'Nederlands/NL',
    region: 'Nederland',
    enabled: true
  }
};

// data in { locale: json, ... } format
const LOCALE_DATA = Object.assign({}, ...Object.entries(localeChoices).filter(([k, {enabled}]) => enabled).map(([k, {json}]) => ({ [k]: json })));

function debuglog(str) {
  //  console.log(str);
}
const s = JSON.stringify;

const cookiename = 'perceptionsurvey';
function usercookie_exists() {
  return (Cookies.get(cookiename) != null);
}
function get_usercookie() {
  return Cookies.get(cookiename);
}
function set_usercookie(val) {
  Cookies.set(cookiename, val);
}

function t(k, params) { return intl.get(k, params); }
function thtml(k, params) { return intl.getHTML(k, params); }

function updateLocale(location, currentLanguage, renav) {
  let params = new URLSearchParams(location.search);
  let locale = params.get("locale");
  debuglog(`updateLocale: location.search: ${location.search} locale: ${locale} currentLanguage=${currentLanguage}`);
  if (!locale || locale !== currentLanguage) {
    params.set("locale", currentLanguage);
    const url = location.pathname + '?' + params.toString();
    window.history.replaceState({}, "", url);
    renav(currentLanguage);
  }
  selectLocale(currentLanguage);
}

function defaultLocale(location) {
  if(location) {
    let params = new URLSearchParams(location.search);
    let locale = params.get("locale");
    if (locale && localeChoices[locale]) return locale;
  }
  return 'en-GB';
}

function selectLocale(locale) {
  intl.init({ currentLocale: locale, locales: LOCALE_DATA });
}

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary
}));

// hack to workaround the fact that react-router-dom doesn't support access to
// Location state inside loaders
export const globalInfo = { age: "", consent: false };

export function Index() {
  const [initDone, setInitDone] = useState(false);
  const [preferChecked, setPreferChecked] = useState(false);
  const [preferredGender, setPreferredGender] = useState('');
  const location = useLocation();
  const [currentLanguage, setCurrentLanguage] = useState(defaultLocale(location));
  const navigate = useNavigate();
  function renav(loc) {
    navigate('/?locale='+loc, {replace: true, state: {
      currentLanguage: currentLanguage
    }});
  }

  useEffect(() => { updateLocale(location, currentLanguage, renav); setInitDone(true); }, [location, currentLanguage]);

  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    const value = Object.fromEntries(data.entries());
    globalInfo.debug = value;
    globalInfo.age = value.age;
    globalInfo.consent = value.consent === "on";
    globalInfo.country = value.country;
    globalInfo.postalcode = value.postalcode;
    globalInfo.education = value.education;
    globalInfo.income = value.income;
    globalInfo.gender = value['gender-radio-group'] === "other" ? preferredGender : value['gender-radio-group'];

    value.overrideCurrentLanguage = currentLanguage;
    navigate("/eval?locale="+currentLanguage, { replace: true, state: value }	);
  }

  const currency='€';
  const radioGroupStyle = {border: 1, marginTop: "5px", marginBottom: "5px", padding: "5px"};
  if (!initDone) { return <div></div>; }
  else {
    const altTxt = t('screenshotAltText');
    return <>
  <Helmet>
    <style>{".intro p, .intro li { font-size: 14pt }"}</style>
  </Helmet>
  <LanguageSelector setCurrentLanguage={setCurrentLanguage} currentLanguage={currentLanguage} />
  <form onSubmit={handleSubmit}>
  <div className="intro" style={{...gridStyles, marginTop: 'var(--top-margin)'}}>
    <h1>{t('projectTitle')}</h1>
    <div style={{textAlign: 'center'}}>
      <img src="rate_sample1.jpg" height="200" alt={altTxt}/>&nbsp;<img src="rate_sample2.jpg" height="200" alt={altTxt}/>
    </div>
    {thtml('aboutHTML')}
    <p>
      {t('participate')}
    </p>
  </div>
  <div style={{margin: '1em'}}>
    <Grid container alignItems="center">
      <Grid item xs={4}>
        <FormLabel id="age-label" htmlFor="age">{t('ageLabel')}</FormLabel>
      </Grid>
      <Grid item xs={8}>
        <TextField name="age" id="age" label={t('ageLabel')} required inputProps={{ inputMode: 'numeric', minLength: 1, pattern: '[1-9][0-9]*' }} />
      </Grid>
      <Grid item xs={4}>
        <FormLabel id="education-group-label" htmlFor="education">{t('eduLabel')}</FormLabel>
      </Grid>
      <Grid item xs={8}>
        <FormControl>
          <RadioGroup sx={radioGroupStyle} name="education">
            <FormControlLabel value="Primary" control={<Radio/>} label={t('eduChoice1')}/>
            <FormControlLabel value="Secondary" control={<Radio/>} label={t('eduChoice2')}/>
            <FormControlLabel value="Tertiary" control={<Radio/>} label={t('eduChoice3')}/>
            <FormControlLabel value="Postgraduate" control={<Radio/>} label={t('eduChoice4')}/>
          </RadioGroup>
        </FormControl>
      </Grid>
      <Grid item xs={4}>
        <FormLabel id="gender-group-label" htmlFor="gender-radio-group">{t('genderLabel')}</FormLabel>
      </Grid>
      <Grid item xs={8}>
        <FormControl>
          <RadioGroup sx={radioGroupStyle} name="gender-radio-group">
            <FormControlLabel value="woman" control={<Radio/>} label={t('genderChoice1')} onClick={() => setPreferChecked(false)} />
            <FormControlLabel value="non-binary" control={<Radio/>} label={t('genderChoice2')} onClick={() => setPreferChecked(false)} />
            <FormControlLabel value="man" control={<Radio/>} label={t('genderChoice3')} onClick={() => setPreferChecked(false)} />
            <FormControlLabel control={<Radio checked={preferChecked}
                                              onClick={() => setPreferChecked(true)} value="other"
                                              label={t('genderChoice4')}/>}
                              label={
                                  preferChecked ? (
                                    <TextField disabled={!preferChecked} label={t('pleaseSpecify')} autoFocus onKeyDown={
                                        (e) => setPreferredGender(e.target.value)
                                      }
                                    />
                                  ) : t('genderChoice4')
                              }
            />
            <FormControlLabel value="unspecified" control={<Radio/>} label={t('genderChoice5')} onClick={() => setPreferChecked(false)} />
          </RadioGroup>
        </FormControl>
      </Grid>
      <Grid item xs={4}>
        <FormLabel id="income-group-label" htmlFor="income">{t('incomeLabel')}</FormLabel>
      </Grid>
      <Grid item xs={8}>
        <TextField style={{marginBottom: 8, marginTop: 4}} name="income" id="income" label={currency+" "+t('approxIncome')} inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} />
      </Grid>
      <Grid item xs={4}>
        <FormLabel id="postalcode-label" htmlFor="postalcode">{t('postalLabel')}</FormLabel>
      </Grid>
      <Grid item xs={8}>
        <FormControl>
          <TextField style={{marginBottom: 8}} id="postalcode" name="postalcode" label={t('postalLabel')} inputProps={{ inputMode: 'text', pattern: '[0-9A-Za-z]*' }} />
        </FormControl>
      </Grid>
      <Grid item xs={4}>
        <FormLabel id="country-label" htmlFor="country">{t('countryLabel')}</FormLabel>
      </Grid>
      <Grid item xs={8}>
        <FormControl>
          <TextField id="country" name="country" label={t('countryLabel')} inputProps={{ inputMode: 'text', pattern: '[0-9A-Za-z]*' }} />
        </FormControl>
      </Grid>
      <Grid item xs={4}>
          <FormLabel id="consent-label" htmlFor="consent">{t('consent1Label')}</FormLabel>
      </Grid>
      <Grid item xs={8}>
        <FormGroup>
          <FormControlLabel control={<Checkbox required name="consent"/>} label={t('consent2Label')}/>
        </FormGroup>
      </Grid>
      <Grid item xs={8}>
        <Button type="submit" variant="contained">{t('submitLabel')}</Button>
      </Grid>
      <Grid item xs={12}>
        <p>{t('gdpr')}</p>
        <p>{t('controller')}: {gdprControllerName}. {t('email')}: <a href={`mailto:${gdprControllerEmail}`}>{gdprControllerEmail}</a></p>
        {thtml('forGDPRInfoHTML')}
      </Grid>
    </Grid>
  </div>
</form>
  </>
  }
}

const backendFetchURL = backendURL + '/fetch';
const backendGetSessionURL = backendURL + '/getsession';
const backendNewPersonURL = backendURL + '/newperson';
const backendNewRatingURL = backendURL + '/new';
const backendUndoURL = backendURL + '/undo';
const backendGetStatsURL = backendURL + '/getstats';
const backendCountRatingsByCategory = backendURL + '/countratingsbycategory';

async function backendCall(url, json) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({cookie_hash: get_usercookie(), ...json})
  });
  if(response.ok)
    return await response.json();
  else {
    const errorjson = await response.json();
    errorjson['failed'] = true;
    return errorjson;
  }
}

export async function indexLoader() {
  if (usercookie_exists()) {
    const json = await backendCall(backendGetSessionURL, { cookie_hash: get_usercookie() });
    debuglog(`getSession(${get_usercookie()}) => ${s(json)}`);
    if(json.session_id)
      return redirect("/eval");
  }
  return null;
}

export async function reportLoader() {
  if (usercookie_exists()) {
    const json = await backendCall(backendGetSessionURL, { cookie_hash: get_usercookie() });
    debuglog(`getSession(${get_usercookie()}) => ${s(json)}`);
    return json;
  }
  return redirect("/");
}

export async function evalLoader(globalInfo) {
  if (usercookie_exists()) {
    const json = await backendCall(backendGetSessionURL, { cookie_hash: get_usercookie() });
    debuglog(`getSession(${get_usercookie()}) => ${s(json)}`);
    if (json.session_id) {
      globalInfo.session_id = json.session_id;
      globalInfo.sessionStats = await backendCall(backendGetStatsURL, { session_id: json.session_id });
      return globalInfo;
    }
  }
  if (!globalInfo.consent) {
    return redirect("/");
  } else {
    const args = {
      age: globalInfo.age, monthly_gross_income: globalInfo.income, education: globalInfo.education,
      gender: globalInfo.gender, country: globalInfo.country, postcode: globalInfo.postalcode,
      consent: globalInfo.consent
    };
    const json = await backendCall(backendNewPersonURL, args)
    debuglog(`newPerson(${s(args)} => ${s(json)})`)
    if (json.failed) {
      return redirect('/');
    }
    set_usercookie(json.cookie_hash);
    globalInfo.sessionStats = {averages: {}};
    return {...json,...globalInfo};
  }
}

const gridStyles = {
  border: 0,
  backgroundColor: "white",
  marginTop: 0,
  marginBottom: 2,
  marginLeft: "auto",
  marginRight: "auto",
  maxWidth: 'var(--primary-width)'
};

const buttonDescs = [
  { smiley: "\u{1F626}", text: "buttonDesc1" },
  { smiley: "\u{1F641}", text: "buttonDesc2" },
  { smiley: "\u{1F610}", text: "buttonDesc3" },
  { smiley: "\u{1F642}", text: "buttonDesc4" },
  { smiley: "\u{1F603}", text: "buttonDesc5" }
];

const categoryDescs = [
  { category_id: 1, shortname: 'walkabilityLabel' , description: 'walkabilityDesc' },
  { category_id: 2, shortname: 'bikeabilityLabel' , description: 'bikeabilityDesc' },
  { category_id: 3, shortname: 'pleasantnessLabel', description: 'pleasantnessDesc' },
  { category_id: 4, shortname: 'greennessLabel'   , description: 'greennessDesc' },
  { category_id: 5, shortname: 'safetyLabel'      , description: 'safetyDesc' }
];

function randompick(arr, num = 1) {
  const idxs = [];
  var idx;
  num = num > arr.length ? arr.length : num;
  for (var i = 0; i < num; i++) {
    do {
      idx = Math.floor(Math.random() * arr.length);
    } while (idxs.includes(idx));
    idxs.push(idx);
  }
  return idxs.map((idx) => arr[idx]);
}


function Streetview({ name, centred, id }) {
  const [loading, setLoading] = useState(true);
  const imgRef = useRef();
  useEffect(() => {
    if(!imgRef.current.complete) setLoading(true);
  }, [name]);
  return <>
    <div style={{ display: loading ? "block" : "none",
                  width: centred ? "var(--primary-width)" : "120px",
                  height: centred ? "calc(var(--primary-width) * 3 / 4)" : "90px",
                  backgroundColor: "#dddddd" }} />
    <img
        onLoad={(e) => { setLoading(false); }}
        ref={imgRef}
        id={id}
        src={name}
        style={{ display: loading ? "none" : "block",
                 width: centred ? "var(--primary-width)" : "120px",
                 margin: centred ? undefined : 'auto' }}
        className={centred ? 'main' : 'imp'}
        alt="streetview"
      />
    </>;
}
 
const PrefButton = styled(Button)({
  textTransform: "none"
});


function LanguageSelector({currentLanguage, setCurrentLanguage}) {
  return <ul className="languagelist">
     { Object.entries(localeChoices).filter(([k, {enabled}]) => enabled).map(([l, {shortname}]) => {
       return <li key={l} className="languagename">
         { l === currentLanguage ?
           <span className='selectedlanguage'>{shortname}</span>
         : <a className="unselectedlanguage" onClick={() => setCurrentLanguage(l)}>{shortname}</a> }
         </li>;
      })}
    </ul>
}

export function Eval() {
  const [initDone, setInitDone] = useState(false);
  const location = useLocation();
  //debuglog(`location.state=${s(location.state)}`);
  const loaderData = useLoaderData();
  const navigate = useNavigate();
  //debuglog(`loaderData = ${s(loaderData)}`);
  const [showImpressions, setShowImpressions] = useState(true);
  const [buttonsDisabled, setButtonsDisabled, buttonsDisabledRef] = useState(false);
  let enableTimeoutID, timeoutPriority=0;
  function disableButtons() {
    if (enableTimeoutID) {
      clearTimeout(enableTimeoutID);
      timeoutPriority=0;
    }
    setButtonsDisabled(true);
  }
  function enableButtons({extraDelay=0}={}) {
    if (extraDelay >= timeoutPriority) {
      timeoutPriority=extraDelay;
      enableTimeoutID = setTimeout(() => {
        setButtonsDisabled(false);
        timeoutPriority = 0;
      }, buttonReenableTimeout+extraDelay);
    }
  }
  const [undoInfo, setUndoInfo, undoInfoRef] = useState(null);
  const [curView, setCurView, curViewRef] = useState({
    // queue of categories (shortname/id) to process next
    categoriesToRate: [],
    // currently shown category
    categoryToRate: {shortname: '', category_id: 0},
    // queue of fetches (images) to process next
    fetchesToRate: [],
    // currently shown image
    fetchToRate: {main_image: {url: '', image_id: 0}}
  });
  const containerRef = useRef(null);
  const [{ x: dragX, y: dragY }, api] = useSpring(() => ({ x: 0, y: 0 }));
  const [highlightedButton, setHighlightedButton, highlightedButtonRef] = useState(-1);
  const [tooltipIsOpen, setTooltipIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [alertBox, setAlertBox] = useState('');
  const [alertProps, alertAPI] = useSpring(() => ({config: { friction: 120, tension: 280 }}));
  const [flashProps, flashAPI] = useSprings(buttonDescs.length, () => ({config: { friction: 1200, tension: 280 }}));
  const [categoryProgress, setCategoryProgress, categoryProgressRef] = useState({});
  const [categoryShown, setCategoryShown, categoryShownRef] = useState({});
  const [sessionStats, setSessionStats, sessionStatsRef] = useState(loaderData.sessionStats);
  const [currentLanguage, setCurrentLanguage] = useState(defaultLocale(location));

  function renav(loc) {
    navigate('/eval?locale='+loc, {replace: true, state: {
      curView: curView,
      undoInfo: undoInfo,
      currentLanguage: currentLanguage
    }});
  }

  function setAlert(msg) {
    const delay = 3000 + 1000 * msg.length / 8;
    alertAPI.stop();
    setAlertBox(msg);
    alertAPI.start({immediate: true, to: {opacity: 1}});
    alertAPI.start({delay, from: {opacity: 1}, to: {opacity: 0}, onRest: () => {
      setAlertBox('');
    }});
  }

  async function sendRatingWithAnimation(rating) {
    if (rating > 0 && rating <= 5) {
      const dir = (rating < 3 ? -1 : 1);
      flashAPI.start((i) => {
        if (i !== rating-1) return;
        return { from: { backgroundColor: '#00ff00' }, to: { backgroundColor: 'rgba(0,0,0,0)' } };
      });
      api.start({ x: (window.innerWidth + 200) * dir });
      await sendRating(rating);
      await refresh();
      api.start({
        from: { x: (window.innerWidth + 200) * -dir },
        to: { x: 0 }
      });
    }
  }

  async function skipWithAnimation() {
    const fetch = curViewRef.current.fetchToRate;
    const category = curViewRef.current.categoryToRate;
    setAlert(t('skippedAlert'));
    api.start({ y: -1 * (window.innerHeight + 200) });
    setUndoInfo({fetch, category, skipped: true});
    await refresh();
    api.start({
      from: { y: 1 * (window.innerHeight + 200) },
      to: { y: 0 }
    });
  }

  // Set the drag hook and send rating (or not) based on movement
  const bind = useDrag(async ({ down, active, movement: [mx, my] }) => {
    // See swipe-model.txt to see the screen layout of swipe regions
    const skipY = -50, nullX = 50, nullY = 50, ratingW = 80;

    debuglog(`bind active=${active} down=${down} mx=${Math.floor(mx)} my=${Math.floor(my)}`);
    if(buttonsDisabledRef.current) return;
    // Move the image around if it is currently being swiped ('down')
    api.start({ x: down ? mx : 0, y: down ? my : 0, immediate: down });
    if (active) {
      setTooltipIsOpen(false);
      // If the user swipes the image back to the starting point then do nothing
      if(Math.abs(mx) < nullX && my < nullY && my >= skipY)
        setHighlightedButton(-1);
      // Swipe up = skip (button 0)
      else if(my < skipY)
        setHighlightedButton(0);
      else setHighlightedButton((rating) => {
        // Formula to pick rating based on swipe (left/right)
        const newRating = Math.max(1,Math.min(5,(Math.ceil((mx+(2.5 * ratingW))/ratingW))));
        return newRating;
      });
    } else {
      const rating = highlightedButton;
      if(rating >= 0) {
        disableButtons();
        if(my < skipY || rating === 0)
          await skipWithAnimation();
        else
          await sendRatingWithAnimation(rating);
        setHighlightedButton(-1);
        enableButtons();
      }
    }
  });

  async function refresh() {
    if(Object.keys(categoryProgress).length < categoryDescs.length) {
      const res = await backendCall(backendCountRatingsByCategory, { session_id: loaderData.session_id });
      if (res.failed) {
        debuglog('countratingsbycategory failed');
      } else {
        updateProgress(res);
      }
    }

    if(location && location.state) {
      if(location.state.overrideCurrentLanguage) {
        setCurrentLanguage(location.state.overrideCurrentLanguage);
        location.state.overrideCurrentLanguage = null;
      }
      if(location.state.overrideUndoInfo) {
        setUndoInfo(location.state.overrideUndoInfo);
        location.state.overrideUndoInfo = null;
      }
      if(location.state.overrideCurView) {
        setCurView(location.state.overrideCurView);
        location.state.overrideCurView = null;
        window.history.replaceState({}, document.title);
        return;
      }
      window.history.replaceState({}, document.title);
    }

    await refreshFetches();
    refreshCategories();
  }

  async function refreshFetches({debugname='refresh'}={}) {
    // perform async fetches outside of setCurView because setters get weird
    // when they are updated with async functions
    let fetchesToRate = curViewRef.current.fetchesToRate;

    if (fetchesToRate.length === 0) {
      const res = await backendCall(backendFetchURL, { session_id: loaderData.session_id });
      if (res.failed) {
        debuglog('fetch failed');
        fetchesToRate = [];
      } else {
        fetchesToRate = [res];
      }
    }
    const fetchToRate = fetchesToRate.pop();
    //debuglog(`${debugname}: fetchToRate=${fetchToRate.main_image.image_id} fetchesToRate=${fetchesToRate.map(f => f.main_image.image_id)}`);
    setCurView(curView => ({...curView, fetchToRate, fetchesToRate}));
  }

  function refreshCategories({debugname='refresh', checkProgressOnly=false}={}) {
    let { categoriesToRate, categoryToRate } = curViewRef.current;
    const prevCategory = categoryToRate;
    // Filter out categories that have been completed already
    const prog = categoryProgressRef.current;
    //debuglog(`${debugname}: categoryProgress=${s(categoryProgressRef.current)}`);
    function f ({category_id}) {
      return !prog.hasOwnProperty(category_id) || prog[category_id] > 0
    }
    //debuglog(`${debugname}: (0) categoriesToRate=${(categoriesToRate.map((c) => c?.shortname))}`);
    let filteredCategoriesToRate = categoriesToRate.filter(f);
    //debuglog(`${debugname}: filteredCategoriesToRate=${(filteredCategoriesToRate.map((c) => c?.shortname))}`);

    if (filteredCategoriesToRate.length === 0) {
      const filteredCats = categoryDescs.filter(f);
      const randCats = randompick(filteredCats, filteredCats.length);
      categoriesToRate = randCats.flatMap((x) => [x, x, x, x, x]);
    } else
      categoriesToRate = filteredCategoriesToRate;

    if (!checkProgressOnly || (categoryToRate && prog[categoryToRate.category_id] === 0)) {
      categoryToRate = categoriesToRate.pop();
      if (categoryToRate) {
        const id = categoryToRate.category_id;
        const isCategoryChange = id !== prevCategory.category_id;
        if (isCategoryChange)
          disableButtons();
        if (!categoryShownRef.current[id] && (!prog.hasOwnProperty(id) || prog[id] === maximumRatingsPerCategory))
          // It's the first time seeing this category IF:
          //   This category hasn't been shown this session yet (handles skips & undos that don't show up in backend)
          //   AND any progress has been made and recorded in the backend
          // Then, after waiting for the transition to complete, show the tooltip
          setTimeout(() => setTooltipIsOpen(true), categoryChangeExtraTimeout + buttonReenableTimeout);
        setCategoryShown((cs) => { cs[id] = true; return cs; });
        if (isCategoryChange)
          enableButtons({extraDelay: categoryChangeExtraTimeout});
      }
    }

    //debuglog(`${debugname}: categoryToRate=${(categoryToRate?.shortname)}`);
    //debuglog(`${debugname}: categoriesToRate=${(categoriesToRate.map((c) => c?.shortname))}`);

    setCurView (curView => ({ ...curView, categoriesToRate, categoryToRate }));
  }

  useEffect(() => {
    //debuglog(`useEffect [categoryProgress]`);
    refreshCategories({debugname:'useEffect [categoryProgress]', checkProgressOnly:true});
  }, [categoryProgress]);

  useEffect(() => { updateLocale(location, currentLanguage, renav); setInitDone(true); }, [location, currentLanguage]);

  function updateProgress(res) {
    if(!('category_counts' in res)) return;
    const progress = {};
    for (const [category_id, count] of Object.entries(res['category_counts'])) {
      progress[category_id] = Math.max(0, maximumRatingsPerCategory - count);
    }
    setCategoryProgress(progress);
    // Check for any categories that have finished, and remove them from the upcoming queue.
    const categoriesToRate1 = curViewRef.current.categoriesToRate;
    const categoriesToRate2 = categoriesToRate1.filter(({category_id}) => {
      return !progress.hasOwnProperty(category_id) || progress[category_id] > 0;
    });
    if(categoriesToRate1.length !== categoriesToRate2.length)
      setCurView((curView) => {
        return {...curView, ...{
          categoriesToRate: categoriesToRate2
        }};
      });
  }

  async function sendRating(rating) {
    const catId = curViewRef.current.categoryToRate.category_id;
    const imgId = curViewRef.current.fetchToRate.main_image.image_id;
    debuglog(`sendRating(${loaderData.session_id}, ${catId}, ${imgId}, ${rating})`);
    const args = {
      session_id: loaderData.session_id,
      category_id: catId,
      image_id: imgId,
      rating: rating
    };
    const res = await backendCall(backendNewRatingURL, args);
    if (res.failed) {
      debuglog('sendRating failed');
    }
    if (res['timestamp']) {
      const fetch = curViewRef.current.fetchToRate;
      const category = curViewRef.current.categoryToRate;
      setUndoInfo({fetch, category, skipped: false});
    }
    const n = res['session_rating_count'];
    if (n % 20 === 0 && n > 0) {
      const msgs = [ t('thanksMessage1'), t('thanksMessage2'), t('thanksMessage3'), t('thanksMessage4') ];
      const thankI = (Math.floor(n / 20) - 1) % msgs.length;
      setAlert(msgs[thankI].replace('<n>', n));
    }
    updateProgress(res);
    if(Object.values(categoryProgressRef.current).every(x => x === 0))
      setSessionStats(await backendCall(backendGetStatsURL, { session_id: loaderData.session_id }));

    return res['timestamp'];
  }


  async function undoRating() {
    if (undoInfoRef.current.skipped) return 1;
    const args = {
      session_id: loaderData.session_id,
    };
    const res = await backendCall(backendUndoURL, args);
    if (res.failed) {
      debuglog('undoRating failed');
      return null;
    } else {
      setAlert(t('undoAlert'));
      updateProgress(res);
      return res['timestamp'];
    }
  }

  async function handleKeys (event) {
    //debuglog(`Key: ${event.key} with keycode ${event.keyCode} has been pressed.`);
    setTooltipIsOpen(false);
    if (buttonsDisabledRef.current) { return; }
    if (event.keyCode >= 49 && event.keyCode <= 53) {
      disableButtons();
      const rating = event.keyCode - 48;
      await sendRatingWithAnimation(rating);
      enableButtons();
    } else if (event.keyCode == 85) { // key: u
      if (undoInfoRef.current) {
        disableButtons();
        await undoRatingWithAnimation();
        enableButtons();
      }
    } else if (event.keyCode == 83) { // key: s
      disableButtons();
      await skipWithAnimation();
      enableButtons();
    }
  }

  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    const handleFullscreenChange = (e) => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const handleOrientationChange = (e) => {
      if (e.currentTarget.type === 'landscape-primary' ||
          e.currentTarget.type === 'landscape-secondary') {
        handleFullscreenClick();
        setAlert(t('fullScreenAlert'));
      }
    };
    document.body.classList.add('eval');
    window.addEventListener('keyup', handleKeys);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    if (window.screen && window.screen.orientation)
      window.screen.orientation.onchange = handleOrientationChange;
    refresh();
    return () => {
      window.removeEventListener('keydown', handleKeys);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (window.screen && window.screen.orientation)
        window.screen.orientation.unlock();
    };
  }, []); // run-once with empty deps array

  async function handleUndoClick() {
    if(!undoInfoRef.current) return;
    disableButtons();
    setTooltipIsOpen(false);
    await undoRatingWithAnimation();
    enableButtons();
  }

  async function handleSkipClick() {
    disableButtons();
    setTooltipIsOpen(false);
    await skipWithAnimation();
    enableButtons();
  }

  async function undoRatingWithAnimation() {
    api.start({ y: 1 * (window.innerHeight + 200) });
    const ts = await undoRating();
    if(ts) {
      //debuglog(`handleUndoClick: undoInfo.fetch=${s(undoInfoRef.current.fetch)} .category=${undoInfoRef.current.category.shortname} .skipped=${undoInfoRef.current.skipped}`);
      //debuglog(`handleUndoClick: categoryProgress=${s(categoryProgressRef.current)}`);
      setCurView((curView) => {
        return {...curView, ...{
          fetchesToRate: [...curView.fetchesToRate, curView.fetchToRate, undoInfoRef.current.fetch],
          categoriesToRate: [...curView.categoriesToRate, curView.categoryToRate, undoInfoRef.current.category]
        }};
      });
      //debuglog(`handleUndoClick: categoriesToRate=${(curViewRef.current.categoriesToRate.map((c) => c?.shortname))}`);
      setUndoInfo(null);
      await refresh();
    }
    api.start({
      from: { y: -1 * (window.innerHeight + 200) },
      to: { y: 0 }
    });
  }

  function handleReportClick(event) {
    const value = { curView, undoInfo, currentLanguage };
    navigate("/report?locale="+currentLanguage, { replace: true, state: value }	);
  }

  function handleHelpClick(event) {
    const value = { curView, undoInfo, currentLanguage };
    navigate("/help?locale="+currentLanguage, { replace: true, state: value }	);
  }

  async function handleFullscreenClick() {
    if(!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      await window.screen.orientation.lock('portrait');
    } else document.exitFullscreen();
  }

  //debuglog(`check for end: ${s(curViewRef.current.categoriesToRate.map(x => x?.shortname))}`);
  //debuglog(`check for end: ${s(categoryProgress)}`);
  //debuglog(`check for end: ${curViewRef.current.categoryToRate?.shortname} || ${categoryProgressRef.current[curViewRef.current.categoryToRate?.category_id]}`);
  if (!initDone) { return <div></div>; }
  else if (categoryProgressRef.current && Object.values(categoryProgressRef.current).length === categoryDescs.length && Object.values(categoryProgressRef.current).every(x => x === 0)) {
    document.body.classList.remove('eval');
    const stats = sessionStatsRef.current;
    const reportInfo = `Reference number: ${loaderData.session_id}\nKey: ${get_usercookie().slice(0,8)}`;
    let avgs, minImages, maxImages;
    if (stats.hasOwnProperty('failed') && stats.failed) {
      debuglog('getstats failed');
      avgs = {};
      minImages = [];
      maxImages = [];
    } else {
      avgs = stats.averages;
      // add min/max annotations just in case the same entry shows up in both
      // lists; React requires unique 'key' attributes in generated elements.
      minImages = stats.minImages?.map((x) => ({...x,...{type: 'min'}}));
      maxImages = stats.maxImages?.map((x) => ({...x,...{type: 'max'}}));
    }
    const images = minImages?.concat(maxImages) || [];
    return (<>
  <Helmet>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>{"p { font-size: 14pt }"}</style>
  </Helmet>
    <Stack>
      <Item elevation={0}>
        <Typography variant="h4">{t('thankYouAtEnd')}</Typography>
        <p>{t('finalText')}</p>
      </Item>
      <Item elevation={0}>
        <Marquee pauseOnHover={true} pauseOnClick={true}>
        {images.map(({category_id: c_id, url, rating, type}) => {
            const c = categoryDescs.find(c => c.category_id === parseInt(c_id));
            const categoryName = t(c.shortname);
            return <Stack key={`${url} ${c_id} ${rating} ${type}`}>
                     <Item elevation={0}><img src={url} width="200" /></Item>
                     <Item elevation={0}>{t('categoryCaption', {categoryName, rating})}</Item>
                   </Stack>;
        })}
        </Marquee>
        <p>{t('averageText')}:</p>
        <Grid container>
        {Object.entries(avgs).map(([c_id, avg]) => {
            const c = categoryDescs.find(c => c.category_id === parseInt(c_id));
            return <Grid item xs={4} key={c_id}><Item elevation={0}>{t(c.shortname)}: {parseFloat(avg).toFixed(1)}</Item></Grid>;
          })}
        </Grid>
      </Item>
      <Item elevation={0}>
        {thtml('reportEmailMessageHTML', { gdprControllerEmail })}
      </Item>
      <Item elevation={0}>
        <TextField id="report-info-textfield"
          style={{width: 'calc(var(--primary-width)/2)'}}
          onClick={async (e) => {
            await copyToClipboard(reportInfo);
            await e.target.select();
          }}
          defaultValue={reportInfo}
          multiline
          InputProps={{readOnly: true}}/>
        <p>({t('clipboardMessage')})</p>
      </Item>
      <Item elevation={0}>
        <Typography variant="h5">{t('gdprHeading')}</Typography>
        <p>{t('gdpr')}</p>
        <p className="gdprinfo">{t('controller')}: {gdprControllerName}.</p>
        <p className="gdprinfo">{t('email')}: <a href={`mailto:${gdprControllerEmail}`}>{gdprControllerEmail}</a></p>
        <p className="gdprinfo"><a href="https://gdpr.eu/what-is-gdpr/" target="_blank">General Data Protection Regulation (GDPR)</a></p>
      </Item>
    </Stack>
  </>
  )
  } else {
    return (<>
  <Helmet>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  </Helmet>

  {/* Absolutely positioned elements */}
  <LanguageSelector setCurrentLanguage={setCurrentLanguage} currentLanguage={currentLanguage} />
  <Box display="flex" justifyContent="center" style={{width: 'var(--primary-width)'}}>
    <animated.div style={{...alertProps,
                          backgroundColor: '#444444', color: 'white', fontSize: '12pt',
                          borderRadius: 12, padding: 6,
                          zIndex: 999, top: 5, left: `calc(50% - ${alertBox.length / 4}em)`,
                          position: 'absolute', display: alertBox.length > 0 ? 'inline' : 'none'}}
      >{alertBox}</animated.div>
  </Box>
  <div className="skipbutton">
    <PrefButton style={{padding: 0}} disabled={buttonsDisabled} onClick={handleSkipClick}>
      {"\u{2191}"+t('skipLabel')}
    </PrefButton>
  </div>
  <div className="undobutton">
    <PrefButton style={{padding: 0}} disabled={!undoInfo || buttonsDisabled} onClick={handleUndoClick}>
      {"\u{21B6}"+t('undoLabel')}
    </PrefButton>
  </div>
  <div className="fullscreenbutton">
    <PrefButton style={{ padding: 0, backgroundColor: 'rgba(0,0,0,0)' }} onClick={handleFullscreenClick}>
      <svg height="25px" version="1.1" viewBox="0 0 36 36" width="25px">
      <path d="m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z"></path>
      <path d="m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z"></path>
      <path d="m 24,24 -4,0 0,2 L 26,26 l 0,-6 -2,0 0,4 0,0 z"></path>
      <path d="M 12,20 10,20 10,26 l 6,0 0,-2 -4,0 0,-4 0,0 z"></path>
      {isFullscreen ?  <rect x="14" y="14" width="8" height="8" fill="black"/> : ''}
      </svg>
    </PrefButton>
  </div>

  <Grid
    container
    style={{...gridStyles, marginTop: 'var(--top-margin)'}}
    justifyContent="center"
    alignItems="center"
  >
    <Grid
      item
      container
      xs={12}
      spacing={0}
      justifyContent="center"
      alignItems="center"
      ref={containerRef}
    >
      <Grid item >
        <Item style={{ padding: 0, position: 'relative' }} elevation={0}>
          {highlightedButtonRef.current >= 0 && <div className="skipbox" style={highlightedButton == 0 ? {color: 'white', backgroundColor: 'green'} : {} }><Typography variant="h4">{t('skipLabel')}</Typography></div>}
          <animated.div id="main" {...bind()} style={{ x: dragX, y: dragY, touchAction: 'none' }}>
            <Streetview centred="1" name={curView.fetchToRate.main_image.url} />
          </animated.div>
        </Item>
      </Grid>
      <Grid item container>
        <Grid item xs={11}>
          {categoryDescs.map((c) => {
            const id = c.category_id, shortname = t(c.shortname), description = t(c.description);
            const dir = curView.categoryToRate.category_id === id ? "right" : "left";
            const timeout = buttonReenableTimeout + (curView.categoryToRate.category_id === id ? categoryChangeExtraTimeout : 0);
            return <Slide key={id} direction={dir} in={curView.categoryToRate.category_id === id} container={containerRef.current} mountOnEnter unmountOnExit timeout={timeout}>
                     <Item elevation={0} style={{margin: 0, padding: 0, position: 'absolute', backgroundColor: 'rgba(0,0,0,0)'}}>
                       <Typography sx={{zIndex: 1500, fontSize: 28}} variant="h4">
                          <span style={{whiteSpace: 'nowrap'}} className="unselectable"> {t('rateLabel')} <span style={{textDecoration: 'underline'}} data-tooltip-id={`category-tooltip-${id}`} onMouseEnter={() => setTooltipIsOpen(true)} onClick={() => setTooltipIsOpen(!tooltipIsOpen)}>{shortname}<sup style={{fontSize: '50%'}}>{"\u{24d8}"}</sup></span></span>
                        <Tooltip clickable={true} onClick={() => setTooltipIsOpen(false)} isOpen={tooltipIsOpen && curView.categoryToRate.category_id === id} id={`category-tooltip-${id}`}>
                          <div onMouseLeave={() => setTooltipIsOpen(false)}>
                            <div style={{fontSize: 'medium', inlineSize: 300, overflowWrap: 'break-word'}} onClick={() => setTooltipIsOpen(false)}>{description}</div>
                            <button style={{fontSize: 'large', width: '100%'}} onClick={() => setTooltipIsOpen(false)}>{t('closeLabel')}</button>
                          </div>
                        </Tooltip>
                        </Typography>
                      </Item>
                   </Slide>;})}
        </Grid>
        <Grid item xs={1}>
          <Item elevation={0} style={{padding: 0, margin: 0}}>
            <div style={{height: '28pt'}}> {/* Maintain height of row even with 'position: absolute' used above */}
            </div>
          </Item>
        </Grid>
      </Grid>
      <Grid item >
        <Grid item container xs spacing={0}>
          {buttonDescs.map((bd, idx) => {
            async function handleClick() {
              disableButtons();
              setTooltipIsOpen(false);
              await sendRatingWithAnimation(idx+1);
              enableButtons();
            }
            const buttonStyle = {
              borderStyle: 'solid',
              borderWidth: 4,
              borderColor: highlightedButtonRef.current === idx+1 ? '#00ff00' : 'rgba(0,0,0,0)',
              padding: 0,
              margin: 0,
              maxWidth: 'calc(var(--primary-width) / 5)'
            };
            return (
              <animated.div style={{borderRadius: 5, ...flashProps[idx]}} key={idx+1}>
                <PrefButton style={{...buttonStyle}} disabled={buttonsDisabled} onClick={handleClick}>
                  <Stack spacing={0}>
                    <Item style={{fontSize: '28pt', padding: '2px', backgroundColor: 'rgba(0,0,0,0)'}} elevation={0}>{bd.smiley}</Item>
                    <Item style={{fontSize: '14pt', padding: '2px', backgroundColor: 'rgba(0,0,0,0)'}} elevation={0}>{t(bd.text)}</Item>
                  </Stack>
                </PrefButton>
              </animated.div>
            );
          })}
        </Grid>
      </Grid>
    </Grid>
    <Grid item xs={12}>
      <Item elevation={0} style={{padding: 0, paddingTop: '8px'}}>
        <svg height="15px" version="1.1" width="300px">
        <polyline points="0,7 100,7" stroke="black"/>
        <text x="120" y="12">{t('progressLabel')}</text>
        <polyline points="200,7 300,7" stroke="black"/>
        </svg>
      </Item>
    </Grid>
    {
      categoryDescs.map((c) => {
        const id = c.category_id, shortname = t(c.shortname), description = t(c.description);
        let prog = maximumRatingsPerCategory;
        if(id in categoryProgress)
          prog = categoryProgress[id];
        const bgCol = curView.categoryToRate.category_id === id ? '#6a1b9a' : '#aaa';
        return <Grid item xs={4} key={id}>
                 <Stack spacing={0}>
                   <Item elevation={0}>
                     <ProgressBar completed={maximumRatingsPerCategory - prog} maxCompleted={maximumRatingsPerCategory} isLabelVisible={false} animateOnRender={true} bgColor={bgCol} />
                     {curView.categoryToRate.category_id === id ? <strong>{shortname}</strong>
                     : prog === 0 ? <s>{shortname}</s>
                     : shortname}
                   </Item>
                 </Stack>
               </Grid>;
      })
    }
    <Grid item xs={10} alignItems="left">
      <Item style={{padding: 0, display: 'flex'}} elevation={0}>
        {//<a style={{textDecoration: 'none', color: 'blue'}} href="/report" onClick={handleReportClick}>Report a problem or make a suggestion</a>
        }
        <PrefButton style={{padding: 0}} onClick={handleReportClick}>
          {t('reportLabel')}
        </PrefButton>
      </Item>
    </Grid>
    <Grid item xs={2} alignItems="right">
      <Item style={{padding: 0}} elevation={0}>
        {//<a style={{textDecoration: 'none', color: 'blue'}} href="/report" onClick={handleReportClick}>Report a problem or make a suggestion</a>
        }
        <PrefButton style={{padding: 0}} onClick={handleHelpClick}>
          {t('helpLabel')}
        </PrefButton>
      </Item>
    </Grid>
    <Grid item xs={12}>
    {/*
      <p><i>(debugging info)</i></p>
      <p>{loaderData.age}, {loaderData.income}, {loaderData.education}, {loaderData.gender}, {loaderData.postalcode}, {loaderData.consent ? "consented" : "oops"}</p>
      <p>{s(loaderData.categories)}</p>
    */}
    </Grid>
  </Grid>
  </>
  );
  }
}

async function copyToClipboard(textToCopy) {
    // from https://stackoverflow.com/a/65996386
    // Navigator clipboard api needs a secure context (https)
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
    } else {
        // Use the 'out of viewport hidden text area' trick
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        // Move textarea out of the viewport so it's not visible
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (error) {
            console.error(error);
        } finally {
            textArea.remove();
        }
    }
}

export function Report() {
  const [initDone, setInitDone] = useState(false);
  const loaderData = useLoaderData();
  const location = useLocation();
  const curView = location.state?.curView;
  const undoInfo = location.state?.undoInfo;
  const navigate = useNavigate();
  const [currentLanguage, setCurrentLanguage] = useState(location.state?.currentLanguage || defaultLocale(location));
  async function goBack() {
    navigate('/eval?locale='+currentLanguage, {replace: true, state: {
      overrideCurView: curView,
      overrideUndoInfo: undoInfo,
      overrideCurrentLanguage: currentLanguage
    }});
  }

  function renav(loc) {
    navigate('/report?locale='+loc, {replace: true, state: {
      curView: curView,
      undoInfo: undoInfo,
      currentLanguage: currentLanguage
    }});
  }

  useEffect(() => {
    document.body.classList.remove('eval');
  },[]);

  useEffect(() => { updateLocale(location, currentLanguage, renav); setInitDone(true); }, [location, currentLanguage]);

  const reportInfo = curView ? `Reference number: ${loaderData.session_id}\nKey: ${get_usercookie().slice(0,8)}\nImage ID: ${curView.fetchToRate.main_image.image_id}\nCategory: ${curView.categoryToRate.category_id}` : `Reference number: ${loaderData.session_id}\nKey: ${get_usercookie().slice(0,8)}`;
  if (!initDone) { return <div></div>; }
  else {
    return <>
    <LanguageSelector setCurrentLanguage={setCurrentLanguage} currentLanguage={currentLanguage} />
    <Grid
      item
      container
      xs={12}
      direction="column"
      spacing={0}
      justifyContent="center"
      style={{...gridStyles, marginTop: 'var(--top-margin)'}}
    >

      <Grid item xs={4}>
        <Box justifyContent="flex-start">
          <PrefButton onClick={goBack}>
            {"\u{2B05}"+t('backLabel')}
          </PrefButton>
        </Box>
      </Grid>

      <Grid item xs={12}>
        {thtml('reportEmailMessageHTML', { gdprControllerEmail })}
      </Grid>
      <Grid item container direction="row" >
        <Grid item xs={12}>
          <Item elevation={0}>
            <TextField id="report-info-textfield"
              style={{width: 'calc(var(--primary-width)/2)'}}
              onClick={async (e) => {
                await copyToClipboard(reportInfo);
                await e.target.select();
              }}
              defaultValue={reportInfo}
              multiline
              InputProps={{readOnly: true}}/>
            <p>({t('clipboardMessage')})</p>
          </Item>
        </Grid>
      </Grid>

      { curView ? <>
      <Grid item xs={4}>
        <Box justifyContent="flex-start">
          <p>{t('forYourReference')}:</p>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Box justifyContent="center">
          <Streetview name={curView.fetchToRate.main_image.url} />
        </Box>
        <Box justifyContent="center">
          <a href="https://www.mapillary.com/" target="_blank"><img src="mapillary_logo.png" width={120}/></a>
        </Box>
      </Grid> </> :
      '' }

      <Grid item xs={12}>
        <Item elevation={0}>
          <Typography variant="h5">{t('gdprHeading')}</Typography>
          <p>{t('gdpr')}</p>
          <p className="gdprinfo">{t('controller')}: {gdprControllerName}.</p>
          <p className="gdprinfo">{t('email')}: <a href={`mailto:${gdprControllerEmail}`}>{gdprControllerEmail}</a></p>
          <p className="gdprinfo"><a href="https://gdpr.eu/what-is-gdpr/" target="_blank">General Data Protection Regulation (GDPR)</a></p>
        </Item>
      </Grid>

{/*
      <Grid item xs={4}>
        <Item>
          <p>{s(curView.fetchToRate)}</p>
          <p>{s(loaderData)}</p>
          <p><a href="mailto:gdpr.percept.geo@uu.nl">gdpr.percept.geo@uu.nl</a></p>
        </Item>
      </Grid>
      */}
    </Grid>
  </>;
  }
}

export function Help() {
  const [initDone, setInitDone] = useState(false);
  const location = useLocation();
  const curView = location.state?.curView;
  const undoInfo = location.state?.undoInfo;
  const [currentLanguage, setCurrentLanguage] = useState(location.state?.currentLanguage || defaultLocale(location));
  const navigate = useNavigate();
  async function goBack() {
    navigate('/eval?locale='+currentLanguage, {replace: true, state: {
      overrideCurView: curView,
      overrideUndoInfo: undoInfo,
      overrideCurrentLanguage: currentLanguage
    }});
  }
  function renav(loc) {
    navigate('/help?locale='+loc, {replace: true, state: {
      curView: curView,
      undoInfo: undoInfo,
      currentLanguage: currentLanguage
    }});
  }

  useEffect(() => {
    document.body.classList.remove('eval');
  },[]);

  useEffect(() => { updateLocale(location, currentLanguage, renav); setInitDone(true); }, [location, currentLanguage]);

  if (!initDone) { return <div></div>; }
  else {
    return <>
  <Helmet>
    <style>{".help p, .help li { font-size: 14pt }"}</style>
  </Helmet>
  <LanguageSelector setCurrentLanguage={setCurrentLanguage} currentLanguage={currentLanguage} />
  <Stack style={{...gridStyles, marginTop: 'var(--top-margin)'}}>
    <Box justifyContent="flex-start">
      <PrefButton onClick={goBack}>
        {"\u{2B05}"+t('backLabel')}
      </PrefButton>
    </Box>
    <Item elevation={0}>
      <div style={{textAlign: 'center'}}>
        <img src="rate_sample1.jpg" height="200" />&nbsp;<img src="rate_sample2.jpg" height="200" />
      </div>
      <Typography variant="h4">{t('helpLabel')}</Typography>
      <div className="help" style={{textAlign: 'left'}}>
        {thtml('aboutHTML')}
      </div>
    </Item>
    <Item elevation={0}>
      <Typography variant="h4">{t('usageHeading')}</Typography>
      <div className="help">
        <p className="help">{t('usageText')}</p>
      </div>
      <Typography variant="h5">{t('keyboardHeading')}</Typography>
      <div className="help">
        <p className="help">{t('keyboardDesc')}</p>
        <ul className="help" style={{textAlign: 'left'}}>
        <li><b>1</b> &#8230; <b>5</b>: {t('selectRating')}</li>
        <li><b>u</b>: {t('undoLabel')}</li>
        <li><b>s</b>: {t('skipLabel')}</li>
        </ul>
      </div>
    </Item>

  </Stack>
  </>;
  }
}

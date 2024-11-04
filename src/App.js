import "./App.css";
import { useEffect, useRef } from "react";
import ReactDOMServer from 'react-dom/server';
import useState from "react-usestateref";
import {
  useNavigate, redirect, useLoaderData, useLocation
} from "react-router-dom";
import { Stack, Slide, Box, Typography, FormLabel, FormControl, FormControlLabel, FormGroup, TextField, RadioGroup, Radio, Grid, Paper, Button, styled, Checkbox } from "@mui/material";
import React from "react";
import { backendURL, buttonReenableTimeout, categoryChangeExtraTimeout, gdprControllerName, gdprControllerEmail, maximumRatingsPerCategory, currency } from "./config.js";
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


//////////////////////////////////////////////////
// Debugging utility function
function debuglog(str) {
  //  console.log(str);
}
const s = JSON.stringify;

//////////////////////////////////////////////////
// Cookie management
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

//////////////////////////////////////////////////
// Locale support

// Supported Locales
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

// Translation helper functions: insert text from current locale database,
// either in plain text or HTML
function t(k, params) { return intl.get(k, params); }
function thtml(k, params) { return intl.getHTML(k, params); }

function selectLocale(locale) {
  intl.init({ currentLocale: locale, locales: LOCALE_DATA });
}

// Change the locale to `currentLanguage`, provided with a browser location
// object and a continuation function `renav`.
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

// Obtain the default locale from the location object, or 'en-GB' if all else fails.
function defaultLocale(location) {
  if(location) {
    let params = new URLSearchParams(location.search);
    let locale = params.get("locale");
    if (locale && localeChoices[locale]) return locale;
  }
  return 'en-GB';
}

//////////////////////////////////////////////////

// hack to workaround the fact that react-router-dom doesn't support access to
// Location state inside loaders
export const globalInfo = { age: "", consent: false };

// Main page function, serves: /
export function Index() {
  // State var that is set when page initialization completes.
  const [initDone, setInitDone] = useState(false);
  // Logic for radio button / form field for specifying gender.
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

  // submission of demographic pre-survey
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
    // Switch the page to the main body of the survey, the 'eval' part
    navigate("/eval?locale="+currentLanguage, { replace: true, state: value }	);
  }

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
            // Activate the freeform text field when the radio button is checked, deactivate when another option is selected.
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

//////////////////////////////////////////////////
// Backend API interaction

const backendFetchURL = backendURL + '/fetch';
const backendGetSessionURL = backendURL + '/getsession';
const backendNewPersonURL = backendURL + '/newperson';
const backendNewRatingURL = backendURL + '/new';
const backendUndoURL = backendURL + '/undo';
const backendGetStatsURL = backendURL + '/getstats';
const backendCountRatingsByCategory = backendURL + '/countratingsbycategory';

// General function to make a backend call, using one of the above URLs, and the supplied JSON.
// Returns the response JSON or error JSON with field 'failed' = true.
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

//////////////////////////////////////////////////
// Loaders (see the Router definition in index.js), which obtain necessary data
// prior to the page being rendered.

// Loader for the demographic preliminary survey
export async function indexLoader() {
  if (usercookie_exists()) {
    const json = await backendCall(backendGetSessionURL, { cookie_hash: get_usercookie() });
    debuglog(`getSession(${get_usercookie()}) => ${s(json)}`);
    if(json.session_id)
      return redirect("/eval");
  }
  return null;
}

// Loader for the report-a-problem page
export async function reportLoader() {
  if (usercookie_exists()) {
    const json = await backendCall(backendGetSessionURL, { cookie_hash: get_usercookie() });
    debuglog(`getSession(${get_usercookie()}) => ${s(json)}`);
    return json;
  }
  return redirect("/");
}

// Loader for the main survey page
export async function evalLoader(globalInfo) {
  if (usercookie_exists()) {
    // The participant is already in progress, so just retrieve the current session
    const json = await backendCall(backendGetSessionURL, { cookie_hash: get_usercookie() });
    debuglog(`getSession(${get_usercookie()}) => ${s(json)}`);
    if (json.session_id) {
      globalInfo.session_id = json.session_id;
      globalInfo.sessionStats = await backendCall(backendGetStatsURL, { session_id: json.session_id });
      return globalInfo;
    }
  }
  // No cookie, or no session defined, so take the given data from the
  // preliminary survey and make a new session.
  if (!globalInfo.consent) {
    // Consent was not given to collect data, so go back to the start.
    return redirect("/");
  } else {
    // Data from the preliminary survey:
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
    // New cookie created, new session started, reset session statistics:
    set_usercookie(json.cookie_hash);
    globalInfo.sessionStats = {averages: {}};
    return {...json,...globalInfo};
  }
}

//////////////////////////////////////////////////
// Utility definitions

// Styles for the numerous uses of Grid
const gridStyles = {
  border: 0,
  backgroundColor: "white",
  marginTop: 0,
  marginBottom: 2,
  marginLeft: "auto",
  marginRight: "auto",
  maxWidth: 'var(--primary-width)'
};

// The smiley buttons, encoded directly as UTF8 strings, and the localized text captions keys.
const buttonDescs = [
  { smiley: "\u{1F626}", text: "buttonDesc1" },
  { smiley: "\u{1F641}", text: "buttonDesc2" },
  { smiley: "\u{1F610}", text: "buttonDesc3" },
  { smiley: "\u{1F642}", text: "buttonDesc4" },
  { smiley: "\u{1F603}", text: "buttonDesc5" }
];

// Explicit table of categories by ID and with localized keys for the
// shortnames and long descriptions.
const categoryDescs = [
  { category_id: 1, shortname: 'walkabilityLabel' , description: 'walkabilityDesc' },
  { category_id: 2, shortname: 'bikeabilityLabel' , description: 'bikeabilityDesc' },
  { category_id: 3, shortname: 'pleasantnessLabel', description: 'pleasantnessDesc' },
  { category_id: 4, shortname: 'greennessLabel'   , description: 'greennessDesc' },
  { category_id: 5, shortname: 'safetyLabel'      , description: 'safetyDesc' }
];

// Return a `num`-length list of items randomly picked from the array.
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

//////////////////////////////////////////////////
// Several utility elements

// Improved `Item` element
const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary
}));

// Improved `Button` element
const PrefButton = styled(Button)({
  textTransform: "none"
});

// The 'street view' element, showing the main street view image or a smaller
// version, depending on the `centred` argument.
function Streetview({ name, centred, id }) {
  const [loading, setLoading] = useState(true);
  const imgRef = useRef();
  useEffect(() => {
    // If the image is not yet loaded when the page has finished loading, then
    // set the status 'loading' to true so that a grey block is displayed.
    if(!imgRef.current.complete) setLoading(true);
  }, [name]);
  return <>
    {/* While the image is being downloaded, display a grey block: */}
    <div style={{ display: loading ? "block" : "none",
                  width: centred ? "var(--primary-width)" : "120px",
                  height: centred ? "calc(var(--primary-width) * 3 / 4)" : "90px",
                  backgroundColor: "#dddddd" }} />
    {/* When the image is finished loading, display the IMG element: */}
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

// The element responsible for the (clickable) list of language abbreviations
// at the top of the screen, so the user can switch languages/locales.
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

//////////////////////////////////////////////////

// Main page function, serves: /eval
export function Eval() {
  // State var that is set when page initialization completes.
  const [initDone, setInitDone] = useState(false);
  const location = useLocation();
  const loaderData = useLoaderData();
  const navigate = useNavigate();

  // Logic for brief button-disabling effect (to prevent accidental double-clicks)
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

  // Tracking 'undo' information:
  const [undoInfo, setUndoInfo, undoInfoRef] = useState(null);
  // Crucial state variable that tracks the current progress in the survey,
  // including the current category, the current image (a.k.a. the 'fetch'), and the
  // upcoming categories and images/fetches to rate:
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

  // State vars used by the animation feature (moving the image off/on-screen):
  const [{ x: dragX, y: dragY }, api] = useSpring(() => ({ x: 0, y: 0 }));
  // The rating button that gets pressed is briefly 'highlighted' as part of
  // the animation, to make it clear to the participant what has just happened.
  // The button index is `highlightedButton` and the `flashAPI` controls the
  // animation of the highlight.
  const [highlightedButton, setHighlightedButton, highlightedButtonRef] = useState(-1);
  const [flashProps, flashAPI] = useSprings(buttonDescs.length, () => ({config: { friction: 1200, tension: 280 }}));
  // State var tracking the status of the tooltip:
  const [tooltipIsOpen, setTooltipIsOpen] = useState(false);
  // State var tracking the status of the fullscreen feature:
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Alertbox is text that is displayed at the top of the screen:
  const [alertBox, setAlertBox] = useState('');
  // Animation state of the alertbox
  const [alertProps, alertAPI] = useSpring(() => ({config: { friction: 120, tension: 280 }}));
  // Table tracking the number of ratings that remain to be collected for each category:
  const [categoryProgress, setCategoryProgress, categoryProgressRef] = useState({});
  // Table tracking whether a category has been shown to the participant at
  // all, because if not then we display the category tooltip (with
  // description) the first time that the participant is exposed to the
  // category, to ensure that they see the new category and criteria:
  const [categoryShown, setCategoryShown, categoryShownRef] = useState({});
  // State var to hold the session stats (mainly used to display stats at the end of the survey):
  const [sessionStats, setSessionStats, sessionStatsRef] = useState(loaderData.sessionStats);

  // Localization support:
  const [currentLanguage, setCurrentLanguage] = useState(defaultLocale(location));
  function renav(loc) {
    navigate('/eval?locale='+loc, {replace: true, state: {
      curView: curView,
      undoInfo: undoInfo,
      currentLanguage: currentLanguage
    }});
  }

  // Set and animate temporary message at the top of the screen.
  function setAlert(msg) {
    const delay = 3000 + 1000 * msg.length / 8;
    alertAPI.stop();
    setAlertBox(msg);
    alertAPI.start({immediate: true, to: {opacity: 1}});
    alertAPI.start({delay, from: {opacity: 1}, to: {opacity: 0}, onRest: () => {
      setAlertBox('');
    }});
  }

  // Transmit the participant's selected rating to the backend, and animate the
  // transition from the current photo to the next photo.
  async function sendRatingWithAnimation(rating) {
    if (rating > 0 && rating <= 5) {
      flashAPI.start((i) => {
        // Flash the background of the selected rating button only
        // (buttons are numbered 0..4, while ratings are numbered 1..5)
        if (i !== rating-1) return;
        return { from: { backgroundColor: '#00ff00' }, to: { backgroundColor: 'rgba(0,0,0,0)' } };
      });
      // Move the image left or right depending on the chosen rating.
      const dir = (rating < 3 ? -1 : 1);
      // Move the current image off the screen in 'dir' direction
      api.start({ x: (window.innerWidth + 200) * dir });
      // Communicate with backend and await responses
      await sendRating(rating);
      await refresh();
      // Move the new image onto the screen from '-dir' direction
      api.start({
        from: { x: (window.innerWidth + 200) * -dir },
        to: { x: 0 }
      });
    }
  }

  // Skip the current photo, do the animation and alerts accordingly.
  async function skipWithAnimation() {
    const fetch = curViewRef.current.fetchToRate;
    const category = curViewRef.current.categoryToRate;
    // Flash a 'skipped' message on the screen
    setAlert(t('skippedAlert'));
    // Move image off screen
    api.start({ y: -1 * (window.innerHeight + 200) });
    // Set-up the undo info in case the user wants to undo the skip
    setUndoInfo({fetch, category, skipped: true});
    // Get the next photo/category if necessary
    await refresh();
    // Animate the new photo onto the screen
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
      // actively dragging the mouse/finger on screen
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
        // A drag occurred and was released; the selected action is stored in highlightedButton state var.
        // Temporarily disable buttons while performing the action, to avoid accidental double clicks/drags.
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

  // Refresh the cached photos (fetches) and categories on the queue of upcoming ratings-to-do.
  // Also update the progress bars and check if the override* state vars are set; if so then do them.
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
        // If we override the curView then it doesn't make sense to proceed
        // with refreshFetches because the curView has just been configured
        // specifically with a set of fetches; this is generally because we
        // have returned to the main survey page (/eval) from some other page
        // (e.g. by clicking the 'back' link on the /report or /help pages)
        window.history.replaceState({}, document.title);
        return;
      }
      window.history.replaceState({}, document.title);
    }

    await refreshFetches();
    refreshCategories();
  }

  // Communicate with backend to retrieve the next batch of photos (fetches) to
  // rate, if there are none remaining in the local cache.
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

  // Ensure the queue of categories to use when rating is kept up-to-date and
  // progresses smoothly, repeating the same category 5 times before swapping
  // to a different one. Ensure that no more than maximumRatingsPerCategory
  // ratings are accepted for each category by checking the categoryProgress
  // table. When categories change there will be an animation event facilitated
  // by the Slide element (below, in the HTML), and this function complements
  // that animation by waiting categoryChangeExtraTimeout seconds to reenable
  // buttons and display the category tooltip (if this is the first time the
  // participant has seen this category).
  function refreshCategories({debugname='refresh', checkProgressOnly=false}={}) {
    let { categoriesToRate, categoryToRate } = curViewRef.current;
    const prevCategory = categoryToRate;
    // Look at the upcoming queue 'categoriesToRate' and filter out categories
    // that have been completed already.
    const prog = categoryProgressRef.current;
    function f ({category_id}) {
      return !prog.hasOwnProperty(category_id) || prog[category_id] > 0
    }
    let filteredCategoriesToRate = categoriesToRate.filter(f);
    // 'filteredCategoriesToRate' contains a list of upcoming categories that
    // still need participant ratings. Or it is empty.

    if (filteredCategoriesToRate.length === 0) {
      // If it was empty then refill it with a randomly chosen unfinished category.
      const filteredCats = categoryDescs.filter(f);
      const randCats = randompick(filteredCats, filteredCats.length);
      categoriesToRate = randCats.flatMap((x) => [x, x, x, x, x]);
    } else
      categoriesToRate = filteredCategoriesToRate;

    // Skip this part if we are only checking progress after a categoryProgress update.
    if (!checkProgressOnly || (categoryToRate && prog[categoryToRate.category_id] === 0)) {
      // Get the next category from the list
      categoryToRate = categoriesToRate.pop();
      if (categoryToRate) {
        const id = categoryToRate.category_id;
        // Check if this is a category change (prev != upcoming)
        const isCategoryChange = id !== prevCategory.category_id;
        // If it is a change, the Slide element will initiate an animation, and
        // this code complements that animation.
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

    setCurView (curView => ({ ...curView, categoriesToRate, categoryToRate }));
  }

  useEffect(() => {
    // Invoke the first part of refreshCategories whenever the categoryProgress table is updated.
    refreshCategories({debugname:'useEffect [categoryProgress]', checkProgressOnly:true});
  }, [categoryProgress]);

  useEffect(() => { updateLocale(location, currentLanguage, renav); setInitDone(true); }, [location, currentLanguage]);

  // Update the categoryProgress table with the results from a backend API call
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
    // If the filtered list is shorter than the original list, some category has finished.
    if(categoriesToRate1.length !== categoriesToRate2.length)
      setCurView((curView) => {
        return {...curView, ...{
          categoriesToRate: categoriesToRate2
        }};
      });
  }

  // Submit a rating to the backend and wait for response.
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
      // Succeeded - configure the undo information, just in case
      const fetch = curViewRef.current.fetchToRate;
      const category = curViewRef.current.categoryToRate;
      setUndoInfo({fetch, category, skipped: false});
    }
    // Pop up a thank-you message after every 20 ratings
    const n = res['session_rating_count'];
    if (n % 20 === 0 && n > 0) {
      const msgs = [ t('thanksMessage1'), t('thanksMessage2'), t('thanksMessage3'), t('thanksMessage4') ];
      const thankI = (Math.floor(n / 20) - 1) % msgs.length;
      setAlert(msgs[thankI].replace('<n>', n));
    }
    // Update the category progress bars
    updateProgress(res);
    // If all categories have been completed then prepare for the end of the
    // survey by fetching some interesting stats from the backend.
    if(Object.values(categoryProgressRef.current).every(x => x === 0))
      setSessionStats(await backendCall(backendGetStatsURL, { session_id: loaderData.session_id }));

    return res['timestamp'];
  }

  // Perform an 'undo' of a rating and communicate it to the backend; see
  // undoRatingWithAnimation() for the client-side aspect.
  async function undoRating() {
    // Undoing a 'skip' doesn't require backend interaction
    if (undoInfoRef.current.skipped) return 1;
    const args = {
      session_id: loaderData.session_id,
    };
    const res = await backendCall(backendUndoURL, args);
    if (res.failed) {
      debuglog('undoRating failed');
      return null;
    } else {
      // Notify the user of successful undo and update the category progress bars
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

  // Things to do when first loading the page
  useEffect(() => {
    // Prevent right-click in the main survey app window
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    const handleFullscreenChange = (e) => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    // Tilting the phone to the side is treated like clicking the 'go to fullscreen' button
    const handleOrientationChange = (e) => {
      if (e.currentTarget.type === 'landscape-primary' ||
          e.currentTarget.type === 'landscape-secondary') {
        handleFullscreenClick();
        setAlert(t('fullScreenAlert'));
      }
    };
    // Apply the CSS selectors pertaining to the .eval class
    document.body.classList.add('eval');
    window.addEventListener('keyup', handleKeys);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    if (window.screen && window.screen.orientation)
      window.screen.orientation.onchange = handleOrientationChange;
    refresh();
    return () => {
      // Return a function that cleans up the initialized resources
      window.removeEventListener('keydown', handleKeys);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (window.screen && window.screen.orientation)
        window.screen.orientation.unlock();
    };
  }, []); // run-once with empty deps array, see ReactJS docs

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
    // Begin the animation
    api.start({ y: 1 * (window.innerHeight + 200) });
    // Invoke the backend undo functionality
    const ts = await undoRating();
    if(ts) {
      // If the undo succeeded then put the saved unfoInfo state (the fetch / the category) back onto the front of the queue
      setCurView((curView) => {
        return {...curView, ...{
          fetchesToRate: [...curView.fetchesToRate, curView.fetchToRate, undoInfoRef.current.fetch],
          categoriesToRate: [...curView.categoriesToRate, curView.categoryToRate, undoInfoRef.current.category]
        }};
      });
      setUndoInfo(null);
      await refresh();
    }
    // Animate the 'new' (undone) image into the central position on the screen
    api.start({
      from: { y: -1 * (window.innerHeight + 200) },
      to: { y: 0 }
    });
  }

  // User clicked on the Report link
  function handleReportClick(event) {
    const value = { curView, undoInfo, currentLanguage };
    navigate("/report?locale="+currentLanguage, { replace: true, state: value }	);
  }

  // User clicked on the Help link
  function handleHelpClick(event) {
    const value = { curView, undoInfo, currentLanguage };
    navigate("/help?locale="+currentLanguage, { replace: true, state: value }	);
  }

  // User clicked on the Fullscreen button
  async function handleFullscreenClick() {
    if(!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      await window.screen.orientation.lock('portrait');
    } else document.exitFullscreen();
  }

  if (!initDone) { return <div></div>; }
  else if (categoryProgressRef.current && Object.values(categoryProgressRef.current).length === categoryDescs.length && Object.values(categoryProgressRef.current).every(x => x === 0)) {
    // If there is a categoryProgress table, if the length of the table is equal to the number of categories, and if every entry in the table is 0, then the survey is finished.
    // (The Object.values(...) construction is a way to obtain the values of the properties of a JS object as a list)
    document.body.classList.remove('eval');
    // Stats should be stored in a state var, they were updated during the backend communication process (e.g. to submit a rating)
    const stats = sessionStatsRef.current;
    // Just in case there is something wrong with the final rated image, we help the user submit a report if they choose to do so.
    const reportInfo = `Reference number: ${loaderData.session_id}\nKey: ${get_usercookie().slice(0,8)}`;
    let avgs, minImages, maxImages;
    if (stats.hasOwnProperty('failed') && stats.failed) {
      debuglog('getstats failed');
      avgs = {};
      minImages = [];
      maxImages = [];
    } else {
      avgs = stats.averages;
      // add min/max annotations just in case the same image shows up in both
      // min and max lists; React requires unique 'key' attributes in generated elements.
      // By adding this extra field the elements are 'different' according to React
      minImages = stats.minImages?.map((x) => ({...x,...{type: 'min'}}));
      maxImages = stats.maxImages?.map((x) => ({...x,...{type: 'max'}}));
    }
    // put both min and max images into one single list
    const images = minImages?.concat(maxImages) || [];
    // Display the survey final page with some interesting stats
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
        {/* Marquee shows its internals on a sliding (repeating) window, like, well, a marquee. */}
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
        {/* Show average ratings per category */}
        <p>{t('averageText')}:</p>
        <Grid container>
        {Object.entries(avgs).map(([c_id, avg]) => {
            const c = categoryDescs.find(c => c.category_id === parseInt(c_id));
            return <Grid item xs={4} key={c_id}><Item elevation={0}>{t(c.shortname)}: {parseFloat(avg).toFixed(1)}</Item></Grid>;
          })}
        </Grid>
      </Item>
      {/* Add a 'Report' link in case the user wants to make a report about the final image they saw */}
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
      {/* GDPR info for the interest of the user */}
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
    // The survey is NOT complete, show the main body of the survey
    return (<>
  <Helmet>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  </Helmet>

  {/* Language selector (e.g. EN | NL) */}
  <LanguageSelector setCurrentLanguage={setCurrentLanguage} currentLanguage={currentLanguage} />
  {/* The alert box with text messages goes in the upper centre of the screen */}
  <Box display="flex" justifyContent="center" style={{width: 'var(--primary-width)'}}>
    <animated.div style={{...alertProps,
                          backgroundColor: '#444444', color: 'white', fontSize: '12pt',
                          borderRadius: 12, padding: 6,
                          zIndex: 999, top: 5, left: `calc(50% - ${alertBox.length / 4}em)`,
                          position: 'absolute', display: alertBox.length > 0 ? 'inline' : 'none'}}
      >{alertBox}</animated.div>
  </Box>
  {/* The skip button/link */}
  <div className="skipbutton">
    <PrefButton style={{padding: 0}} disabled={buttonsDisabled} onClick={handleSkipClick}>
      {"\u{2191}"+t('skipLabel')}
    </PrefButton>
  </div>
  {/* The undo button/link */}
  <div className="undobutton">
    <PrefButton style={{padding: 0}} disabled={!undoInfo || buttonsDisabled} onClick={handleUndoClick}>
      {"\u{21B6}"+t('undoLabel')}
    </PrefButton>
  </div>
  {/* The fullscreen button, drawn as an SVG in two different ways depending on fullscreen state */}
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
          {/* Show a transient rectangle on the screen when the user is dragging
              the screen, we call this the 'skipbox' because it has the
              (translated) word 'Skip' inside of it and its purpose is to show
              the user where to drag the cursor/finger in order to invoke the
               'skip' function using the drag interaction method. */}
          {highlightedButtonRef.current >= 0 && <div className="skipbox" style={highlightedButton == 0 ? {color: 'white', backgroundColor: 'green'} : {} }><Typography variant="h4">{t('skipLabel')}</Typography></div>}
          {/* The centrepiece of the survey, the actual street view image that
              is being rated, with its position animated by dragging when that
              occurs: */}
          <animated.div id="main" {...bind()} style={{ x: dragX, y: dragY, touchAction: 'none' }}>
            <Streetview centred="1" name={curView.fetchToRate.main_image.url} />
          </animated.div>
        </Item>
      </Grid>
      <Grid item container>
        <Grid item xs={11}>
          {
          /* The part of the interface with the text that states 'Rate <category>' (albeit with translation)
             The reasons for the complications here are: animation and tooltip
             The Slide element animates the movement of the text and
             automatically triggers when the curView.categoryToRate changes
             (see the attribute in={curView.categoryToRate.category_id === id})
             The tooltip has a similar trigger but also the variable tooltipIsOpen must be true. */
          categoryDescs.map((c) => {
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
          {
          // The five rating buttons
          buttonDescs.map((bd, idx) => {
            async function handleClick() {
              disableButtons();
              setTooltipIsOpen(false);
              await sendRatingWithAnimation(idx+1);
              enableButtons();
            }
            const buttonStyle = {
              borderStyle: 'solid',
              borderWidth: 4,
              // The currently highlighted button gets a different border color
              borderColor: highlightedButtonRef.current === idx+1 ? '#00ff00' : 'rgba(0,0,0,0)',
              padding: 0,
              margin: 0,
              maxWidth: 'calc(var(--primary-width) / 5)'
            };
            return (
              // After a button is clicked (or drag-activated) there is an
              // animated 'flash' of the background to show the user which
              // button was activated.
              <animated.div style={{borderRadius: 5, ...flashProps[idx]}} key={idx+1}>
                <PrefButton style={{...buttonStyle}} disabled={buttonsDisabled} onClick={handleClick}>
                  <Stack spacing={0}>
                    {/* Smileys are actually just the Unicode code points represented in UTF8 */}
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
      {/* Draw a nice separator with the title 'Progress' (translated) in
          between the rating buttons and the category progress bars */}
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
        // For each category draw a progress bar based on the categoryProgress table
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
      {/* Report button/link */}
      <Item style={{padding: 0, display: 'flex'}} elevation={0}>
        <PrefButton style={{padding: 0}} onClick={handleReportClick}>
          {t('reportLabel')}
        </PrefButton>
      </Item>
    </Grid>
    <Grid item xs={2} alignItems="right">
      {/* Help button/link */}
      <Item style={{padding: 0}} elevation={0}>
        <PrefButton style={{padding: 0}} onClick={handleHelpClick}>
          {t('helpLabel')}
        </PrefButton>
      </Item>
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

// Main page function, serves: /report
export function Report() {
  // State var that is set when page initialization completes.
  const [initDone, setInitDone] = useState(false);
  const loaderData = useLoaderData();
  const location = useLocation();
  const curView = location.state?.curView;
  const undoInfo = location.state?.undoInfo;
  const navigate = useNavigate();
  const [currentLanguage, setCurrentLanguage] = useState(location.state?.currentLanguage || defaultLocale(location));
  // Go back to the main survey and restore the state that was saved when navigating to this page
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

  // Text for copy/paste convenience:
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

      {/* Back button/link */}
      <Grid item xs={4}>
        <Box justifyContent="flex-start">
          <PrefButton onClick={goBack}>
            {"\u{2B05}"+t('backLabel')}
          </PrefButton>
        </Box>
      </Grid>

      {/* Show the report-making text */}
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

      {
      // Show the image that is being reported, for the user's interest:
      curView ? <>
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
        {/* Show GDPR-related info */}
        <Item elevation={0}>
          <Typography variant="h5">{t('gdprHeading')}</Typography>
          <p>{t('gdpr')}</p>
          <p className="gdprinfo">{t('controller')}: {gdprControllerName}.</p>
          <p className="gdprinfo">{t('email')}: <a href={`mailto:${gdprControllerEmail}`}>{gdprControllerEmail}</a></p>
          <p className="gdprinfo"><a href="https://gdpr.eu/what-is-gdpr/" target="_blank">General Data Protection Regulation (GDPR)</a></p>
        </Item>
      </Grid>
    </Grid>
  </>;
  }
}

// Main page function, serves: /help
export function Help() {
  // State var that is set when page initialization completes.
  const [initDone, setInitDone] = useState(false);
  const location = useLocation();
  const curView = location.state?.curView;
  const undoInfo = location.state?.undoInfo;
  const [currentLanguage, setCurrentLanguage] = useState(location.state?.currentLanguage || defaultLocale(location));
  const navigate = useNavigate();
  // Go back to the main survey and restore the state that was saved when navigating to this page
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
    {/* The Back button/link */}
    <Box justifyContent="flex-start">
      <PrefButton onClick={goBack}>
        {"\u{2B05}"+t('backLabel')}
      </PrefButton>
    </Box>
    {/* Example images and 'About' text (translated): */}
    <Item elevation={0}>
      <div style={{textAlign: 'center'}}>
        <img src="rate_sample1.jpg" height="200" />&nbsp;<img src="rate_sample2.jpg" height="200" />
      </div>
      <Typography variant="h4">{t('helpLabel')}</Typography>
      <div className="help" style={{textAlign: 'left'}}>
        {thtml('aboutHTML')}
      </div>
    </Item>
    {/* Usage information text (translated) */}
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

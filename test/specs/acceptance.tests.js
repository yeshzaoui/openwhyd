var assert = require('assert');
var { URL_PREFIX, ADMIN_USER, TEST_USER } = require('../fixtures.js');
const webUI = require('../web-ui.js');

const WAIT_DURATION = 10000;

require('../acceptance-cmds.js'); // also checks that openwhyd's server is tested against the test database
// TODO: make sure that DB was reset before starting Openwhyd's app server

// reference scenario: https://www.youtube.com/watch?v=aZT8VlTV1YY

describe('landing page page', function() {
  it('should not let visitors access admin endpoints', function() {
    browser.url(URL_PREFIX + '/admin/config/config.json');
    assert(!$('pre').isExisting());
  });

  it('should have Openwhyd in its title', function() {
    browser.url(URL_PREFIX);
    var title = browser.getTitle();
    assert(/Openwhyd/.test(title));
  });

  /*
    it('should not have changed from previous build', function() {
        browser.url(URL_PREFIX);
        var results = browser.checkDocument(); // http://webdriver.io/guide/services/visual-regression.html
        results.forEach((result) => {
            assert(result.isWithinMisMatchTolerance);
        });
    });
    */
});

describe('onboarding', function() {
  it('should lead new user to genre selection page', function() {
    browser.url(URL_PREFIX);
    $('#signup').click();
    $('input[name="email"]').waitForDisplayed();
    $('input[name="name"]').setValue(TEST_USER.username);
    $('input[name="email"]').setValue(TEST_USER.email);
    $('input[name="password"]').setValue(TEST_USER.pwd);
    // TODO: takeSnapshot();
    $('input[type="submit"]').click();
    browser.waitUntil(
      () => /.*\/pick\/genres/.test(browser.getUrl()),
      WAIT_DURATION,
      'expected to be on /pick/genres after 5s'
    );
    // TODO: takeSnapshot();
  });

  it('should suggest people to follow after picking genres', function() {
    const genres = $$('#genreGallery li');
    genres.find(genre => /INDIE/.test(genre.getText())).click();
    genres.find(genre => /ROCK/.test(genre.getText())).click();
    genres.find(genre => /PUNK/.test(genre.getText())).click();
    // TODO: takeSnapshot();
    browser.clickOnLinkWithText('Next');
    browser.waitUntil(
      () => /.*\/pick\/people/.test(browser.getUrl()),
      WAIT_DURATION,
      'expected to be on /pick/people after 5s'
    );
  });

  it('should suggest to install the extension after picking people', function() {
    // TODO: takeSnapshot();
    browser.clickOnLinkWithText('Next');
    browser.waitUntil(
      () => /.*\/pick\/button/.test(browser.getUrl()),
      WAIT_DURATION,
      'expected to be on /pick/button after 5s'
    );
  });

  it('should lead new user to the gdpr consent page, after installing extension', function() {
    // TODO: takeSnapshot();
    browser.clickOnLinkWithText('Next');
    browser.waitUntil(
      () => /.*\/consent/.test(browser.getUrl()),
      WAIT_DURATION,
      'expected to be on /consent after 5s'
    );
  });

  it('should lead to the welcome page, after giving consent', function() {
    // TODO: takeSnapshot();
    browser.waitForContent(/consent to let Openwhyd collect/); // text of the consent checkbox
    $('input[type="checkbox"]').scrollIntoView();
    $('input[type="checkbox"]').click();
    $('input[type="submit"]').click();
    browser.waitUntil(
      () => /.*\/welcome/.test(browser.getUrl()),
      WAIT_DURATION,
      'expected to be on /welcome after 5s'
    );
  });

  it('should display user name after skipping the welcome tutorial', function() {
    // TODO: takeSnapshot();
    browser.waitForContent(/Ok\, Got it/);
    var loggedInUsername = $('#loginDiv .username').getText();
    assert.equal(loggedInUsername, TEST_USER.username);
  });

  webUI.logout();
});

describe('adding a track', function() {
  it('should allow user to login', webUI.loginAs(ADMIN_USER));

  it('should lead user to the gdpr consent page', function() {
    browser.waitUntil(
      () => /.*\/consent/.test(browser.getUrl()),
      WAIT_DURATION,
      'expected to be on /consent after 5s'
    );
    // now, let's give consent
    browser.waitForContent(/consent to let Openwhyd collect/); // text of the consent checkbox
    $('input[type="checkbox"]').scrollIntoView();
    $('input[type="checkbox"]').click();
    $('input[type="submit"]').click();
  });

  it('should recognize a track when pasting a Youtube URL in the search box', function() {
    //browser.url(URL_PREFIX + '/all');
    $('#q').waitForExist();
    $('#q').setValue('https://www.youtube.com/watch?v=aZT8VlTV1YY');
    browser.waitUntil(
      () => $$('#searchResults li a').find(a => /Demo/.test(a.getText())),
      WAIT_DURATION,
      'expected to find a search result after 5s'
    );
  });

  it('should lead to a track page when clicking on the Youtube search result', function() {
    $('#searchResults li a').click();
    browser.waitUntil(
      () => /\/yt\/aZT8VlTV1YY/.test(browser.getUrl()),
      WAIT_DURATION,
      'expected to be on /yt/aZT8VlTV1YY after 5s'
    );
  });

  it('should display the name of the track', function() {
    /*
        browser.waitForContent(/Openwhyd Demo/); // name of the track, fetched asynchronously from youtube
        browser.waitForContent(/Add to/);
        */
    const containsName = () => {
      var crit = false;
      try {
        crit = /Openwhyd Demo \(formerly/.test($('a.btnRepost').getHTML());
      } catch (e) {}
      return crit;
    };
    browser.waitUntil(containsName, WAIT_DURATION);
    assert(true);
  });

  it('should open a dialog after clicking on the "Add to" button', function() {
    //$('a.btnRepost').click();
    browser.clickOnLinkWithText('Add to');
    $('.dlgPostBox').waitForDisplayed();
    browser.pause(1000);
    assert($('.dlgPostBox').isDisplayedInViewport());
  });

  it('should show a link to the post after adding the track', function() {
    $$('.dlgPostBox span')
      .find(a => /Add/.test(a.getText()))
      .click();
    browser.waitForLinkWithText('your tracks');
  });

  it("should show the post on the user's profile after clicking the link", function() {
    browser.clickOnLinkWithText('your tracks');
    browser.waitUntil(
      () => /\/u\//.test(browser.getUrl()),
      WAIT_DURATION,
      "expected to be on the user's profile page after 5s"
    );
    $('.post a[data-eid="/yt/aZT8VlTV1YY"]').waitForDisplayed();
  });

  it('should open the playbar after the user clicks on the post', function() {
    $('.post a[data-eid="/yt/aZT8VlTV1YY"]').click();
    $('#btnPlay').waitForDisplayed();
  });

  it('should play the track', function() {
    $('#btnPlay.playing').waitForDisplayed();
  });

  it('should pause the track when the user clicks on the play/pause button', function() {
    $('#btnPlay.playing').click();
    assert(!/playing/.test($('#btnPlay').classname));
  });

  //webUI.logout();
});

describe('re-adding a track in a playlist', function() {
  // requirement: one track should be accessible from the user's stream

  // webUI.loginAs(ADMIN_USER);

  it('will display a pop-in dialog when clicking the "Add to" button of that track', function() {
    browser.waitForContent(/Add to/);
    browser.clickOnLinkWithText('Add to');
    $('.dlgPostBox').waitForDisplayed();
  });

  it('allows to create a new playlist', function() {
    $('#selPlaylist').waitForDisplayed();
    browser.pause(1000); // leave some time for onclick handler to be setup
    $('#selPlaylist').click();
    $('#newPlaylistName').waitForDisplayed();
    $('#newPlaylistName').setValue('test playlist');
    $('input[value="Create"]').click();
    browser.waitForContent(/test playlist/, '#selPlaylist');
  });

  it('should show a link to the post after re-adding the track', function() {
    $$('.dlgPostBox span')
      .find(a => /Add/.test(a.getText()))
      .click();
    browser.waitForLinkWithText('test playlist');
  });

  it("should show the post on the user's new playlist after clicking the link", function() {
    browser.clickOnLinkWithText('test playlist');
    browser.waitUntil(
      () => /\/u\//.test(browser.getUrl()),
      WAIT_DURATION,
      "expected to be on the user's playlist page after 5s"
    );
    $('.post a[data-eid="/yt/aZT8VlTV1YY"]').waitForDisplayed();
  });

  //webUI.logout();
});

describe('track comments', function() {
  // requirement: at least one track should be accessible from the user's stream

  // webUI.loginAs(ADMIN_USER);

  it(`can be displayed from the user\'s stream`, function() {
    browser.url(URL_PREFIX + '/stream');
    browser.clickOnLinkWithText('Comment');
    browser.waitForContent(/You can mention people/);
  });

  it(`should appear after being added`, function() {
    browser.keys('hello world\n');
    browser.waitForContent(new RegExp(ADMIN_USER.name), '.comments');
    browser.waitForContent(/hello world/, '.comments');
  });

  // TODO: it(`should change after being updated`, function() {

  // TODO: it(`should disappear after being deleted`, function() {
});

describe('searching external tracks', function() {
  it(`can find a youtube track with id that starts with underscore`, function() {
    browser.url(URL_PREFIX);
    $('#q').click();
    browser.keys('http://www.youtube.com/watch?v=_BU841qpQsI');
    const searchResult = `a[onclick="window.goToPage('/yt/_BU841qpQsI');return false;"]`;
    $(searchResult).waitForDisplayed();
    const trimmed = $(searchResult)
      .getText()
      .trim();
    //console.log('text: ', trimmed);
    assert.notEqual(trimmed, ''); // empty string => no metadata was fetched, caused to https://github.com/openwhyd/openwhyd/issues/102
  });
});

// Webdriver API documentation: http://webdriver.io/api.html

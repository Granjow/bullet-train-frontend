/* eslint-disable no-unused-expressions */
/* eslint-disable func-names */
const inviteEmail = 'bullet-train@mailinator.com';
const email = 'nightwatch@solidstategroup.com';
const password = 'nightwatch';
const url = `http://localhost:${process.env.PORT || 8080}`;
const append = `${new Date().valueOf()}`;
const helpers = require('./helpers');

const byId = helpers.byTestID;

module.exports = {
    '[Invite Tests] - Login': function (browser) {
        testHelpers.login(browser, url, email, password);
    },
    '[Invite Tests] - Create organisation': function (browser) {
        browser.expect.element('#create-org-page').to.be.visible;

        browser
            .waitForElementVisible('[name="orgName"]')
            .setValue('[name="orgName"]', `Nightwatch Org${append}`)
            .click('#create-org-btn')
            .waitForElementVisible('#project-select-page')
            .assert.containsText('#org-menu', `Nightwatch Org${append}`);
    },
    '[Invite Tests] - Create project': function (browser) {
        browser
            .waitForElementVisible('#create-first-project-btn')
            .click('#create-first-project-btn')
            .waitForElementVisible('[name="projectName"]')
            .setValue('[name="projectName"]', 'My Test Project')
            .click(byId('create-project-btn'));

        browser.expect.element(byId('features-page')).to.be.visible;
    },
    '[Invite Tests] - Invite user': function (browser) {
        browser
            .pause(200) // Slide in transition
            .click('#organisation-settings-link')
            .waitAndClick('#btn-invite')
            .waitAndSet('[name="inviteEmails"]', inviteEmail)
            .click('#btn-send-invite')
            .waitForElementNotPresent('#btn-send-invite')
            .waitForElementVisible('#org-invites-list div.list-item');
    },
    '[Invite Tests] - Invite user 2': function (browser) {
        browser
            .click('#btn-invite')
            .waitForElementVisible('[name="inviteEmails"]')
            .setValue('[name="inviteEmails"]', 'test@test.com')
            .click('#btn-send-invite')
            .waitForElementNotPresent('#btn-send-invite')
            .waitForElementVisible('#org-invites-list div.list-item:nth-child(2)');
    },
    '[Invite Tests] - Delete user 2': function (browser) {
        browser
            .click('#org-invites-list div.list-item:nth-child(2) #delete-invite')
            .waitForElementVisible('#confirm-btn-yes')
            .click('#confirm-btn-yes')
            .waitForElementNotPresent('#org-invites-list div.list-item:nth-child(2)');
    },
    '[Invite Tests] - Accept invite': function (browser) {
        let inviteUrl;
        browser
            .url('https://mailinator.com/v3/#/#inboxpane')
            .waitForElementVisible('#inbox_field')
            .setValue('#inbox_field', ['bullet-train', browser.Keys.ENTER])
            .useXpath()
            .waitForElementVisible(`//tbody/tr/td/a[contains(text(),"${`Nightwatch Org${append}`}")]`, 60000)
            .click(`//tbody/tr/td/a[contains(text(),"${`Nightwatch Org${append}`}")]`)
            .useCss()
            .waitForElementVisible('#msg_body')
            .pause(1000) // TODO revise this. currently necessary as the msg_body does not appear to show text immediately leading to an empty result
            .frame('msg_body')
            .getText('body', (res) => {
                console.log(res.value);
                inviteUrl = res.value.match(/(https?[^.]*)/g)[0];
                console.log('Invite URL:', inviteUrl);

                browser
                    .back()
                    .back();

                testHelpers.logout(browser);
                testHelpers.login(browser, url, 'nightwatch-invitee@solidstategroup.com', 'nightwatch');

                browser.expect.element('#project-select-page').to.be.visible;
                browser.url(inviteUrl);
                browser
                    .useXpath()
                    .waitForElementPresent(`//div[contains(@class, "org-nav")]//a[contains(text(),"${`Nightwatch Org${append}`}")]`);
            });
    },
    '[Invite Tests] - Delete organisation': function (browser) {
        browser
            .useCss()
            .click('#org-menu')
            .useXpath()
            .waitForElementVisible(`//a[contains(text(),"${`Nightwatch Org${append}`}")]`)
            .pause(200) // Allows the dropdown to fade in
            .click(`//a[contains(text(),"${`Nightwatch Org${append}`}")]`)
            .useCss()
            .waitForElementVisible('#projects-list a.list-item')
            .assert.containsText('#projects-list a.list-item', 'My Test Project')
            .click('#projects-list a.list-item')
            .waitForElementVisible('#organisation-settings-link')
            .pause(200) // slide in transition
            .click('#organisation-settings-link')
            .waitForElementNotPresent('#org-invites-list')
            .waitForElementVisible('#delete-org-btn')
            .click('#delete-org-btn')
            .waitForElementVisible('[name="confirm-org-name"]')
            .setValue('[name="confirm-org-name"]', `Nightwatch Org${append}`)
            .click('#confirm-del-org-btn');

        browser.expect.element('#project-select-page').to.be.visible;
        browser.end();
    },
};

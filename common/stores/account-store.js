import OrganisationStore from './organisation-store';
import ConfigStore from './config-store';

const BaseStore = require('./base/_store');
const data = require('../data/base/_data');

var controller = {
    register: ({ email, password, first_name, last_name, organisation_name = 'Default Organisation' }, isInvite) => {
        store.saving();
        data.post(`${Project.api}auth/register/`, {
            email,
            password1: password,
            password2: password,
            first_name,
            last_name,
        })
            .then((res) => {
                data.setToken(res.key);
                API.trackEvent(Constants.events.REGISTER);
                API.alias(email);
                API.register(email, first_name, last_name);
                if (isInvite) {
                    return controller.onLogin();
                }
                const opts = {};
                if (ConfigStore.model && ConfigStore.model.free_tier && ConfigStore.model.free_tier.enabled) {
                    opts.free_to_use_subscription = true;
                } else {
                    opts.subscription_date = moment();
                }
                return data.post(`${Project.api}organisations/?format=json`, Object.assign({}, { name: organisation_name }, opts))
                    .then(() => controller.onLogin());
            })
            .catch(e => API.ajaxHandler(store, e));
    },
    resetPassword: (uid, token, new_password1, new_password2) => {
        store.saving();
        data.post(`${Project.api}auth/password/reset/confirm/`, {
            uid,
            token,
            new_password1,
            new_password2,
        })
            .then((res) => {
                store.saved();
            })
            .catch(e => API.ajaxHandler(store, e));
    },
    setToken: (token) => {
        store.user = {};
        AsyncStorage.getItem('isDemo', (err, res) => {
            if (res) {
                store.isDemo = true;
            }
            data.setToken(token);
            return controller.onLogin();
        });
    },
    login: ({ email, password }) => {
        store.loading();
        data.post(`${Project.api}auth/login/`, {
            email,
            password,
        })
            .then((res) => {
                const isDemo = email == Project.demoAccount.email;
                store.isDemo = isDemo;
                if (isDemo) {
                    AsyncStorage.setItem('isDemo', `${isDemo}`);
                    API.trackEvent(Constants.events.LOGIN_DEMO);
                } else {
                    API.trackEvent(Constants.events.LOGIN);
                    API.identify(email);
                }
                data.setToken(res.key);
                return controller.onLogin();
            })
            .catch(e => API.ajaxHandler(store, e));
    },
    onLogin: (skipCaching) => {
        if (!skipCaching) {
            AsyncStorage.setItem('t', data.token);
        }
        return controller.getOrganisations();
    },
    acceptInvite: (id) => {
        store.saving();
        return data.post(`${Project.api}users/join/${id}/?format=json`)
            .then((res) => {
                store.savedId = res.id;
                store.model.organisations.push(res);
                AsyncStorage.setItem('user', JSON.stringify(store.model));
                store.saved();
            })
            .catch(e => API.ajaxHandler(store, e));
    },
    getOrganisations: () => {
        return Promise.all([data.get(`${Project.api}organisations/?format=json`), data.get(`${Project.api}auth/user/`)])
            .then(([res, userRes]) => {
                controller.setUser({
                    organisations: res.results,
                    ...userRes,
                });
            })
            .catch((e) => API.ajaxHandler(store, e))
    },

    selectOrganisation: (id) => {
        store.organisation = _.find(store.model.organisations, { id });
        store.changed();
    },

    editOrganisation: (org) => {
        API.trackEvent(Constants.events.EDIT_ORGANISATION);
        data.put(`${Project.api}organisations/${store.organisation.id}/?format=json`, org)
            .then((res) => {
                const idx = _.findIndex(store.model.organisations, { id: store.organisation.id });
                if (idx != -1) {
                    store.model.organisations[idx] = res;
                    store.organisation = res;
                }
                store.saved();
            });
    },

    createOrganisation: (name) => {
        store.saving();
        API.trackEvent(Constants.events.CREATE_ORGANISATION);
        const opts = {};
        if (ConfigStore.model && ConfigStore.model.free_tier && ConfigStore.model.free_tier.enabled) {
            opts.free_to_use_subscription = true;
        } else {
            opts.subscription_date = moment();
        }
        data.post(`${Project.api}organisations/?format=json`, Object.assign({ name }, opts))
            .then((res) => {
                store.model.organisations = store.model.organisations.concat([res]);
                AsyncStorage.setItem('user', JSON.stringify(store.model));
                store.savedId = res.id;
                store.saved();
            });
    },

    setUser(user) {
        if (!store.model && user) {
            store.model = user;
            store.organisation = user && user.organisations && user.organisations[0];
            AsyncStorage.setItem('user', JSON.stringify(store.model));
            API.identify(user && user.email);
            store.loaded();
        } else if (!user) {
            AsyncStorage.clear();
            data.setToken(null);
            store.isDemo = false;
            store.model = user;
            store.organisation = null;
            store.trigger('logout');
            API.reset();
        }
    },

    deleteOrganisation: () => {
        API.trackEvent(Constants.events.DELETE_ORGANISATION);
        data.delete(`${Project.api}organisations/${store.organisation.id}/?format=json`)
            .then((res) => {
                store.model.organisations = _.filter(store.model.organisations, org => org.id !== store.organisation.id);
                store.organisation = store.model.organisations.length ? store.model.organisations[0] : null;
                store.trigger('removed');
                AsyncStorage.setItem('user', JSON.stringify(store.model));
            });
    },
};


var store = Object.assign({}, BaseStore, {
    id: 'account',
    getUser() {
        return store.model;
    },
    setToken(token) {
        data.token = token;
    },
    getUserId() {
        return store.model && store.model.id;
    },
    setUser(user) {
        controller.setUser(user);
    },
    getOrganisation() {
        return store.organisation;
    },
    getOrganisations() {
        return store.model && store.model.organisations;
    },
});

store.dispatcherIndex = Dispatcher.register(store, (payload) => {
    const action = payload.action; // this is our action from handleViewAction

    switch (action.actionType) {
        case Actions.SET_USER:
            controller.setUser(action.user);
            break;
        case Actions.SET_TOKEN:
            controller.setToken(action.token);
            break;
        case Actions.SELECT_ORGANISATION:
            controller.selectOrganisation(action.id);
            break;
        case Actions.CREATE_ORGANISATION:
            controller.createOrganisation(action.name);
            break;
        case Actions.ACCEPT_INVITE:
            controller.acceptInvite(action.id);
            break;
        case Actions.DELETE_ORGANISATION:
            controller.deleteOrganisation();
            break;
        case Actions.EDIT_ORGANISATION:
            controller.editOrganisation(action.org);
            break;
        case Actions.LOGOUT:
            controller.setUser(null);
            break;
        case Actions.REGISTER:
            controller.register(action.details, action.isInvite);
            break;
        case Actions.RESET_PASSWORD:
            controller.resetPassword(action.uid, action.token, action.new_password1, action.new_password2);
            break;
        case Actions.LOGIN:
            controller.login(action.details);
            break;
        case Actions.GET_ORGANISATIONS:
            controller.getOrganisations();
            break;
        default:
    }
});

controller.store = store;
module.exports = controller.store;

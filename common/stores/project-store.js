const BaseStore = require('./base/_store');
const OrganisationStore = require('./organisation-store');

const data = require('../data/base/_data');

const controller = {

    getProject: (id) => {
        if (!store.model || !store.model.environments || store.id != id) {
            store.loading();

            Promise.all([
                data.get(`${Project.api}projects/${id}/?format=json`),
                data.get(`${Project.api}projects/${id}/environments/?format=json`),
            ]).then(([project, environments]) => {
                store.model = Object.assign(project, { environments });
                if (project.organisation != OrganisationStore.id) {
                    AppActions.selectOrganisation(project.organisation);
                    AppActions.getOrganisation(project.organisation);
                }
                store.id = id;
                store.loaded();
            });
        }
    },

    createEnv: (name, projectId) => {
        API.trackEvent(Constants.events.CREATE_ENVIRONMENT);
        data.post(`${Project.api}environments/?format=json`, { name, project: projectId })
            .then((res) => {
                data.post(`${Project.api}environments/${res.api_key}/identities/`, {
                    environment: res.api_key,
                    identifier: `${name.toLowerCase()}_user_123456`,
                })
                    .then(() => {
                        store.savedEnv = res;
                        if (store.model && store.model.environments) {
                            store.model.environments = store.model.environments.concat([res]);
                        }
                        store.saved();
                        AppActions.refreshOrganisation();
                    });
            });
    },
    editEnv: (env) => {
        API.trackEvent(Constants.events.EDIT_ENVIRONMENT);
        data.put(`${Project.api}environments/${env.api_key}/?format=json`, env)
            .then((res) => {
                const index = _.findIndex(store.model.environments, { id: env.id });
                store.model.environments[index] = res;
                store.saved();
                AppActions.refreshOrganisation();
            });
    },
    deleteEnv: (env) => {
        API.trackEvent(Constants.events.REMOVE_ENVIRONMENT);
        data.delete(`${Project.api}environments/${env.api_key}/?format=json`)
            .then((res) => {
                store.model.environments = _.filter(store.model.environments, e => e.id != env.id);
                store.trigger('removed');
                store.saved();
                AppActions.refreshOrganisation();
            });
    },
    editProject: (project) => {
        store.saving();
        data.put(`${Project.api}projects/${project.id}/?format=json`, project)
            .then((res) => {
                store.model = Object.assign(store.model, res);
                store.saved();
            });
    },
};


var store = Object.assign({}, BaseStore, {
    id: 'project',
    getEnvs: () => store.model && store.model.environments,
    getEnvironment: api_key => store.model && _.find(store.model.environments, { api_key }),
    getFlags: () => store.model && store.model.flags,
});


store.dispatcherIndex = Dispatcher.register(store, (payload) => {
    const action = payload.action; // this is our action from handleViewAction

    switch (action.actionType) {
        case Actions.GET_PROJECT:
            controller.getProject(action.projectId);
            break;
        case Actions.CREATE_ENV:
            controller.createEnv(action.name, action.projectId);
            break;
        case Actions.EDIT_ENVIRONMENT:
            controller.editEnv(action.env);
            break;
        case Actions.DELETE_ENVIRONMENT:
            controller.deleteEnv(action.env);
            break;
        case Actions.EDIT_PROJECT:
            controller.editProject(action.id, action.project);
            break;
        default:
    }
});
controller.store = store;
module.exports = controller.store;

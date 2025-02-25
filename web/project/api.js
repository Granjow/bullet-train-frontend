global.API = {
    ajaxHandler(store, res) {
        switch (res.status) {
            case 404:
                // ErrorModal(null, 'API Not found: ');
                break;
            case 503:
                // ErrorModal(null, error);
                break;
            default:
            // ErrorModal(null, error);
        }

        // Catch coding errors that end up here
        if (res instanceof Error) {
            console.log(res);
            return;
        }

        res.json().then((error) => {
            if (store) {
                store.error = error;
                store.goneABitWest();
            }
        }).catch((e) => {
            if (store) {
                store.goneABitWest();
            }
        });
    },
    trackEvent(data) {
        if (Project.ga) {
            if (!data) {
                console.error('Passed null event data');
            }
            console.info('track', data);
            if (!data || !data.category || !data.event) {
                console.error('Invalid event provided', data);
            }
            ga('send', {
                hitType: 'event',
                eventCategory: data.category,
                eventAction: data.event,
                eventLabel: data.label,
            });
        }

        if (Project.mixpanel) {
            if (!data) {
                console.error('Passed null event data');
            }
            console.info('track', data);
            if (!data || !data.category || !data.event) {
                console.error('Invalid event provided', data);
            }
            mixpanel.track(data.event, {
                category: data.category,
            });
        }
    },
    trackPage(title) {
        if (Project.ga) {
            ga('send', {
                hitType: 'pageview',
                title,
                location: document.location.href,
                page: document.location.pathname,
            });
        }

        if (Project.mixpanel) {
            mixpanel.track('Page View', {
                title,
                location: document.location.href,
                page: document.location.pathname,
            });
        }
    },
    alias(id) {
        if (Project.mixpanel) {
            mixpanel.alias(id);
        }
        bulletTrain.identify(id);
        bulletTrain.setTrait("email", id);
    },
    identify(id) {
        if (Project.mixpanel) {
            mixpanel.identify(id);
        }
        bulletTrain.identify(id);
        bulletTrain.setTrait("email", id);
    },
    register(email, firstName, lastName) {
        if (Project.mixpanel) {
            mixpanel.register({
                'Email': email,
                'First Name': firstName,
                'Last Name': lastName,
            });
        }
    },
    reset() {
        if (Project.mixpanel) {
            mixpanel.reset();
        }
        bulletTrain.logout();
    },
    log() {
        console.log.apply(this, arguments);
    },
};

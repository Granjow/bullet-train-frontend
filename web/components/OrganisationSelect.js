import React, { Component, PropTypes } from 'react';

const OrganisationSelect = class extends Component {
	static displayName = 'OrganisationSelect'

	constructor(props, context) {
	    super(props, context);
	    this.state = {};
	}

	render() {
	    return (
    <AccountProvider>
        {({ isLoading, user }) => (
            <div>
                {user && user.organisations && user.organisations.map(organisation => (
                    <div key={organisation.id}>
                        <a
                          href="#" onClick={() => {
								    this.props.onChange && this.props.onChange(organisation);
                          }}
                        >
                            {organisation.name}
                        </a>
                    </div>
                ))}
            </div>
        )}
    </AccountProvider>
	    );
	}
};

OrganisationSelect.propTypes = {};

module.exports = OrganisationSelect;

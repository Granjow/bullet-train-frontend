import React from 'react';

import LegalAside from '../LegalAside';
import PrivacyPolicy from './PrivacyPolicyPage';
import ServiceLevelAgreement from './ServiceLevelAgreementPage';
import Footer from '../Footer';
import TermsOfService from './TermsOfServicePage';

const TermsPoliciesPage = class extends React.Component {
    static contextTypes = {
        router: React.PropTypes.object.isRequired,
    };

    static displayName = 'TermsPoliciesPage'

    constructor(props, context) {
        super(props, context);
        this.state = {};
    }

    componentWillMount() {
        API.trackPage(Constants.pages.POLICIES);
    }

    componentDidMount() {
        if (this.props.location.pathname == '/legal') {
            this.context.router.replace('/legal/tos');
        }
    }

    render = () => {
        const { hasFeature, getValue, params: { section } } = this.props;
        return (
            <div>
                <LegalAside/>
                <div className="aside-body">
                    {(() => {
                        switch (section) {
                            case 'privacy-policy':
                                return <PrivacyPolicy/>;

                            case 'sla':
                                return <ServiceLevelAgreement/>;

                            case 'tos':
                            default:
                                return <TermsOfService/>;
                        }
                    })()}
                </div>
                <Footer className="legalpage"/>
            </div>
        );
    }
};
module.exports = ConfigProvider(TermsPoliciesPage);

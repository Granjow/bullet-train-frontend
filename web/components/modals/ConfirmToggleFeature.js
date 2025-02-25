import React, { Component, PropTypes } from 'react';

const ConfirmToggleFeature = class extends Component {
    static displayName = 'ConfirmToggleFeature'

    constructor(props, context) {
        super(props, context);
        this.state = {
            name: props.name,
        };
    }

    close() {
        closeModal();
    }

    render() {
        const { environmentFlag, projectFlag, identity } = this.props;
        const isEnabled = !!(environmentFlag && environmentFlag.enabled);
        return (
            <ProjectProvider>
                {({ project }) => (
                    <div id="confirm-toggle-feature-modal">
                        <p>
                            This will
                            turn
                            {' '}
                            <strong>{Format.enumeration.get(projectFlag.name)}</strong>
                            {' '}
                            {isEnabled ? <span className="feature--off"><strong>"Off"</strong></span>
                                : <span className="feature--on"><strong>"On"</strong></span>}
                            {' '}
                            for
                            <strong>{_.find(project.environments, { api_key: this.props.environmentId }).name}</strong>
                            {identity && (
                                <span>
                                    {' '}
                                    user
                                    <strong>{this.props.identity}</strong>
                                </span>
                            )}
                        </p>
                        {/* <FormGroup> */}
                        {/* <div> */}
                        {/* <strong> */}
                        {/* Comments (Optional) */}
                        {/* </strong> */}
                        {/* </div> */}
                        {/* <textarea rows={5} onChange={(e) => this.setState({comment: Utils.safeParseEventValue(e)})}> */}

                        {/* </textarea> */}
                        {/* </FormGroup> */}
                        {/* <Row> */}
                        {/* Do the same for all environments <Switch */}
                        {/* checked={this.state.allEnvironments} */}
                        {/* onChange={(allEnvironments) => { */}
                        {/* this.setState({allEnvironments}) */}
                        {/* }}/> */}
                        {/* </Row> */}
                        <FormGroup className="text-right">
                            <Button
                              onClick={() => {
                                  this.close();
                                  this.props.cb(this.state.allEnvironments ? project.environments : [_.find(project.environments, { api_key: this.props.environmentId })]);
                              }} className="btn btn-primary" id="confirm-toggle-feature-btn"
                            >
                                Confirm changes
                            </Button>
                        </FormGroup>
                    </div>
                )}
            </ProjectProvider>
        );
    }
};

ConfirmToggleFeature.propTypes = {};

module.exports = ConfirmToggleFeature;

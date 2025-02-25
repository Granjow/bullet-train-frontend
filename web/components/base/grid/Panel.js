const Panel = class extends React.Component {
    static displayName = 'Panel'

    constructor(props, context) {
        super(props, context);
        this.state = {};
    }

    render() {
        return (
            <div className={`panel panel-default ${this.props.className || ''}`}>
                <div className="panel-heading">
                    <Row space>
                        <Row className="flex-1">
                            {this.props.icon && (
                                <span className="panel-icon"><ion className={`icon ${this.props.icon}`}/></span>
                            )}
                            <h6 className="m-b-0">{this.props.title}</h6>
                        </Row>
                        {this.props.action}
                    </Row>
                </div>
                <div className="panel-content">
                    {this.props.children}
                </div>
            </div>
        );
    }
};

Panel.displayName = 'Panel';

Panel.propTypes = {
    title: oneOfType([OptionalObject, OptionalString]),
    icon: OptionalObject,
    children: OptionalNode,
};

module.exports = Panel;

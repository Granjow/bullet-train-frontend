/**
 * Created by kylejohnson on 30/07/2016.
 */
import MaskedInput from 'react-maskedinput';
import cn from 'classnames';

const maskedCharacters = {
    'a': {
        validate(char) {
            return /[ap]/.test(char);
        },
    },
    'm': {
        validate(char) {
            return /\w/.test(char);
        },
        transform() {
            return 'm';
        },
    },
};
const Input = class extends React.Component {
    static displayName = 'Input'

    constructor(props, context) {
        super(props, context);
        this.state = { shouldValidate: false };
    }

    onFocus = (e) => {
        this.setState({
            isFocused: true,
        });
        this.props.onFocus && this.props.onFocus(e);
    }

    focus = () => {
        this.input.focus();
    }

    onKeyDown = (e) => {
        if (Utils.keys.isEscape(e)) {
            this.input.blur();
        }
        this.props.onKeyDown && this.props.onKeyDown(e);
    }

    validate = () => {
        this.setState({
            shouldValidate: true,
        });
    }

    onBlur = (e) => {
        this.setState({
            shouldValidate: true,
            isFocused: false,
        });
        this.props.onBlur && this.props.onBlur(e);
    }

    render() {
        const { isValid, onSearchChange, mask, placeholderChar, ...rest } = this.props;

        const className = cn({
            'input-container': true,
            'focused': this.state.isFocused,
            'invalid': this.state.shouldValidate && !isValid,
        }, this.props.className);

        const inputClassName = cn({
            input: true,
        }, this.props.inputClassName);

        return (
            <div
              className={className}
            >
                {mask ? (
                    <MaskedInput
                      ref={c => this.input = c}
                      {...rest}
                      mask={this.props.mask}
                      formatCharacters={maskedCharacters}
                      onKeyDown={this.onKeyDown}
                      onFocus={this.onFocus}
                      onBlur={this.onBlur}
                      className={inputClassName}
                      placeholderChar={placeholderChar}
                    />
                ) : (
                    <input
                      ref={c => this.input = c}
                      {...rest} onFocus={this.onFocus}
                      onKeyDown={this.onKeyDown}
                      onBlur={this.onBlur}
                      value={this.props.value}
                      className={inputClassName}
                    />
                )}
            </div>
        );
    }
};

Input.defaultProps = {
    className: '',
    placeholderChar: ' ',
    isValid: true,
};

Input.propTypes = {
    isValid: React.PropTypes.any,
    onKeyDown: OptionalFunc,
    onFocus: OptionalFunc,
    onBlur: OptionalFunc,
    placeholderChar: OptionalString,
    mask: OptionalString,
    className: React.PropTypes.any,
    inputClassName: OptionalString,
    onSearchChange: OptionalFunc,
};

module.exports = Input;

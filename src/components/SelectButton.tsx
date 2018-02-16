import * as React from "react";
import FaSquareO = require("react-icons/lib/fa/square-o");
import FaSquare = require("react-icons/lib/fa/square");
import FaCheckSquare = require("react-icons/lib/fa/check-square");

/**
 * Callback function for SelectButton.
 */
interface SelectButtonOnChange {
    (checked: boolean, id: string) : void
}

/**
 * The sate of checked values.
 */
export enum SelectButtonState {
    Unselected = -1, PartiallySelected = 0, Selected = 1,
}

/**
 * The interface which is used to store all required data for a SelectButton.
 *
 */
export interface SelectButtonData {
    checked?: SelectButtonState,
    onChange?: SelectButtonOnChange,
}

/**
 * Generates the button data from given values.
 *
 * @param {boolean} checked The already defined select button data on element. Used if available.
 * @param {SelectButtonOnChange} onChange The callback function on change. Usually uses parent's function (passing recursively the root's function)
 * @returns {SelectButtonData} The new SelectButtonData.
 * @constructor
 */
export function SelectButtonDataFactory(checked : boolean, onChange : SelectButtonOnChange) : SelectButtonData {
    return {
        checked: checked ? SelectButtonState.Selected : SelectButtonState.Unselected,
        onChange: onChange,
    };
}

/**
 * SelectButton properties definition.
 */
interface SelectButtonProps {
    onChange: (checked : boolean) => void,
    checked: SelectButtonState
}

/**
 * Creates a checkbox from button. On click event the callback function onChange is fired with the corresponding
 * value (if it was selected then with a false otherwise a true value is passed to the callback.)
 * Using fa-check-square, fa-square-o and fa-square for indicating the sates.
 *
 * @class SelectButton
 */
export class SelectButton extends React.Component<SelectButtonProps, {}> {
    render() {
        let icon : JSX.Element;
        let switchVal : boolean;

        switch (this.props.checked) {
            case SelectButtonState.Unselected:
                icon = <FaSquareO/>;
                switchVal = true;
                break;
            case SelectButtonState.PartiallySelected:
                icon = <FaSquare/>;
                switchVal = true;
                break;
            case SelectButtonState.Selected:
                icon = <FaCheckSquare/>;
                switchVal = false;
                break;
            default: console.log("Invalid value passed to SelectButton:", this.props.checked);
        }


        return (
            <button className="SelectButton" onClick={() => this.props.onChange(switchVal)}>
                    {icon}
            </button>
        )
    }
}
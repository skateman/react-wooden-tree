/**
 * The props interface for the tree component.
 */
export interface TreeProps {
    data?: TreeData;                     // < The definitions of the tree nodes.

    // Checkbox
    showCheckbox?: boolean;             // < Option: whenever the checkboxes are displayed.
    hierarchicalCheck?: boolean;        // < If enabled parent and children are reflecting each other changes.
    checkboxFirst?: boolean;            // < Determines if the node icon or the checkbox is the first.

    // Selection
    multiSelect?: boolean;              // < Determines if multiple nodes can be selected.
    preventDeselect?: boolean;          // < Determines if can be deselected all nodes.
    allowReselect?: boolean;            // < Used with preventDeselect allows to fire selected event on selected node.

    // Icons
    showIcon?: boolean;                 // < Determines if the icons are showed in nodes.
    showImage?: boolean;                // < Determines if images are preferred to the icons.
    nodeIcon?: string;                  // < Default icon for nodes without it.
    checkedIcon?: string;               // < The checkbox-checked icon.
    uncheckedIcon?: string;             // < The checkbox-unchecked icon.
    partiallyCheckedIcon?: string;      // < The checkbox-partially selected icon.
    collapseIcon?: string;              // < The icon for collapsing parents.
    expandIcon?: string;                // < The icon for expanding parents.
    loadingIcon?: string;               // < The loading icon when loading data with ajax.
    errorIcon?: string;                 // < The icon displayed when lazyLoading went wrong.
    selectedIcon?: string;              // < The icon for selected nodes.

    // Styling
    changedCheckboxClass?: string;      // < Extra class for the changed checkbox nodes.
    selectedClass?: string;             // < Extra class for the selected nodes.

    // Other
    isRedux?: boolean;                // < Determines which version to use (redux or non)

    callbacks: {
        // Callbacks
        /**
         * All changes made in the tree will be propagated upwards.
         * Every time the tree changes the node's data the callback will be fired.
         *
         * @param {string} nodeId The node's nodeId.
         * @param {string} dataType The currently changed information.
         * @param {boolean} newValue The newly assigned value.
         */
        onDataChange: (nodeId: string, dataType: string, newValue: any) => void;

        /**
         * The function which will be called when a lazily loadable node is
         * expanded first time.
         *
         * @param {NodeProps} node The node of the node which has to be loaded.
         * @returns {Promise<NodeProps[]>} Promise about the children of the given node.
         */
        lazyLoad?: (node: NodeProps) => Promise<TreeData>;
    };
}

/**
 * Interface for all data required from the tree root.
 */
export interface ParentData {
    // Non redux
    tree: TreeData;

    // Callbacks
    checkboxOnChange: CheckboxButtonOnChange;
    expandOnChange: ExpandButtonOnChange;
    selectOnChange: (nodeId: string, selected: boolean) => void;
    onLazyLoad: (nodeId: string) => void;
    showCheckbox: boolean;
    initSelectedNode: (nodeId: string) => void;

    // Icons
    showIcon: boolean;                 // < Determines if the icons are showed in nodes.
    showImage: boolean;                // < Determines if images are preferred to the icons.
    nodeIcon: string;                  // < Default icon for nodes without it.
    checkedIcon: string;               // < The checkbox-checked icon.
    uncheckedIcon: string;             // < The checkbox-unchecked icon.
    partiallyCheckedIcon: string;      // < The checkbox-partially selected icon.
    collapseIcon: string;              // < The icon for collapsing parents.
    expandIcon: string;                // < The icon for expanding parents.
    loadingIcon: string;               // < The loading icon when loading data with ajax.
    errorIcon: string;                 // < The icon displayed when lazyLoading went wrong.
    selectedIcon: string;              // < The icon for selected nodes.

    // Styling
    changedCheckboxClass: string;      // < Extra class for the changed checkbox nodes.
    selectedClass: string;             // < Extra class for the selected nodes.

    // Other
    checkboxFirst: boolean;            // < Determines the order of the icon and the checkbox.
    isRedux: boolean;                  // < Determines if it should use the redux or the non redux version.
}

/**
 * Node properties interface.
 */
export interface NodeProps {
    nodeId?: string;
    text?: string;
    nodes?: string[];
    state?: {
        checked?: boolean;
        disabled?: boolean;
        expanded?: boolean;
        selected?: boolean;
    };

    checkable?: boolean;
    hideCheckbox?: boolean;

    selectable?: boolean;
    selectedIcon?: string;

    lazyLoad?: boolean;
    loading?: boolean; // Null when error occurred

    attr?: {[key: string]: string};

    // Styling
    icon?: string;
    iconColor?: string;
    iconBackground?: string;
    image?: string;
    classes?: string;

    // Private
    parentData?: ParentData;
}

/**
 * Defines the TreeData format
 */
export interface TreeData {
    [key: string]: NodeProps;
}

/**
 * Checkbox states
 */
export const Checkbox = {
    CHECKED: true,
    UNCHECKED: false,
    PARTIALLY: null as boolean,
};

/**
 * Callback function for CheckboxButton.
 */
export interface CheckboxButtonOnChange {
    (checked: boolean, nodeId: string): void;
}

/**
 * CheckboxButton properties definition.
 */
export interface CheckboxButtonProps {
    onChange: (checked: boolean) => void;
    checked: boolean;
    checkedIcon: string;
    partiallyCheckedIcon: string;
    uncheckedIcon: string;
}

/**
 * Callback function for ExpandButton.
 */
export interface ExpandButtonOnChange {
    (nodeId: string, opened: boolean): void;
}

/**
 * ExpandButton properties definition.
 */
export interface ExpandButtonProps {
    onChange: (checked: boolean) => void;
    expanded: boolean;
    loading: boolean; // null when error occurred.
    expandIcon: string;
    collapseIcon: string;
    loadingIcon: string;
    errorIcon: string;
}

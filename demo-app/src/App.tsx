import * as React from 'react';
import 'font-awesome/css/font-awesome.min.css';
import './App.css';
import { Tree } from './components/Tree';
import { generator } from './Generator';
import { NodeProps } from './components/Node';

interface AppState {
    tree: NodeProps[];
}

class App extends React.Component<{}, AppState> {
    private data: NodeProps[];

    private actionMapper = {
        'state.expanded': Tree.nodeExpanded,
        'state.checked': Tree.nodeChecked,
        'state.disabled': Tree.nodeDisabled,
        'state.selected': Tree.nodeSelected,
        'nodes': Tree.nodeChildren,
        'loading': Tree.nodeLoading,
    };

    /**
     * Constructor.
     * @param {{}} props
     */
    constructor(props: {}) {
        super(props);

        this.data = Tree.initTree(generator(), '', true);

        console.log('Node search result:',
            Tree.nodeSearch(this.data, null, 'data-random', 'random'));

        this.state = {
            tree: this.data,
        };

        this.onDataChange = this.onDataChange.bind(this);
        this.lazyLoad = this.lazyLoad.bind(this);
    }

    /**
     * The callback function for changing data in the tree.
     *
     * @param {string} nodeId The nodeId of the node.
     * @param {string} type The field name which changed.
     * @param {boolean} value The new value to assign.
     */
    onDataChange(nodeId: string, type: string, value: boolean): void {
        let node = Tree.nodeSelector(this.data, nodeId);
        if ( node == null ) { return; }

        if (this.actionMapper.hasOwnProperty(type)) {
            node = this.actionMapper[type](node, value);
            this.data = Tree.nodeUpdater(this.data, node);
        } else {
            // console.log(nodeId, type, value);
        }

        this.setState({tree: this.data});
    }

    /**
     * The lazy loading function - Dummy
     *
     * @param {NodeProps} node The node to get children.
     * @returns {NodeProps[]} The children.
     */
    lazyLoad(node: NodeProps): Promise<NodeProps[]> {
        let isWorking = true;

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if ( isWorking ) {
                    resolve(Tree.initTree(generator(), node.nodeId, true));
                } else {
                    reject(new Error('Something happened.'));
                }
            }, 2000);
        });
    }

    render() {
        return (
          <div className="App">
            <div id="tree-label">
                <p>A test tree</p>
            </div>
            <Tree
                treeLabelId={'tree-label'}
                hierarchicalCheck={true}
                showCheckbox={true}
                multiSelect={false}
                preventDeselect={true}
                allowReselect={true}
                checkboxFirst={true}
                nodeIcon={'fa fa-fw fa-circle'}
                // partiallyCheckedIcon={'fa fa-ban'}
                data={this.state.tree}
                onDataChange={this.onDataChange}
                lazyLoad={this.lazyLoad}
                accessibility={true}
            />
          </div>
        );
    }
}

export default App;

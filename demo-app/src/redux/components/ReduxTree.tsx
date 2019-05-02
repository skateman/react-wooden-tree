import { connect } from 'react-redux';
import { Tree, TreeProps, TreeDataType } from 'react-wooden-tree';

const mapStateToProps = ({ treeData }: TreeDataType) => {
    return {data: {...treeData}};
};

export const ReduxTree = connect(mapStateToProps)(
    Tree as React.ComponentClass<TreeProps, {}>
) as React.ComponentClass<TreeProps, {}>;

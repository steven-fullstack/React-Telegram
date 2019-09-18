/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Document from '../../Message/Media/Document';
import RichText from './RichText';
import ArrowDownwardIcon from '@material-ui/core/SvgIcon/SvgIcon';
import DocumentTile from '../../Tile/DocumentTile';
import { getSrc } from '../../../Utils/File';
import FileStore from '../../../Stores/FileStore';

class Icon extends React.Component {
    componentDidMount() {
        FileStore.on('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
    }

    onClientUpdateDocumentThumbnailBlob = update => {
        const { thumbnail } = this.props;
        if (!thumbnail) return;

        const file = thumbnail.photo;
        if (!file) return;

        const { fileId } = update;

        if (file.id !== fileId) {
            return;
        }

        this.forceUpdate();
    };

    render() {
        const { document, height, width } = this.props;
        if (!document) return null;

        const { thumbnail, document: file } = document;
        const thumbnailSrc = getSrc(thumbnail ? thumbnail.photo : null);

        return (
            <img
                src={thumbnailSrc}
                width={width > 0 ? width : null}
                height={height > 0 ? height : null}
                draggable={false}
                alt=''
            />
        );
    }
}

Icon.propTypes = {
    document: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired
};

export default Icon;

/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { getFitSize, getVideoDurationString } from '../../../Utils/Common';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './Video.css';

class Video extends React.Component {
    constructor(props) {
        super(props);

        const { message } = props;
        const { video } = message.content;

        this.state = {
            width: video.width,
            height: video.height,
            duration: video.duration,
            thumbnail: video.thumbnail
        };
    }

    componentDidMount() {
        FileStore.on('clientUpdateVideoThumbnailBlob', this.onClientUpdateVideoBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateVideoThumbnailBlob', this.onClientUpdateVideoBlob);
    }

    onClientUpdateVideoBlob = update => {
        const { thumbnail } = this.state;
        const { fileId } = update;

        if (!thumbnail) return;

        if (thumbnail.photo && thumbnail.photo.id === fileId) {
            this.forceUpdate();
        }
    };

    render() {
        const { displaySize, openMedia } = this.props;
        const { thumbnail, duration } = this.state;

        const fitPhotoSize = getFitSize(thumbnail, displaySize);
        if (!fitPhotoSize) return null;

        const file = thumbnail ? thumbnail.photo : null;
        const blob = FileStore.getBlob(file.id) || file.blob;
        const src = FileStore.getBlobUrl(blob);
        const isBlurred = thumbnail && Math.max(thumbnail.width, thumbnail.height) < 320;

        return (
            <div className='video' style={fitPhotoSize} onClick={openMedia}>
                <img
                    className={classNames('video-preview', { 'video-preview-blurred': isBlurred })}
                    style={fitPhotoSize}
                    src={src}
                    alt=''
                />
                <div className='video-play'>
                    <PlayArrowIcon />
                </div>
                <div className='video-duration'>{getVideoDurationString(duration)}</div>
            </div>
        );
    }
}

Video.propTypes = {
    message: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired,
    size: PropTypes.number,
    displaySize: PropTypes.number
};

Video.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default Video;

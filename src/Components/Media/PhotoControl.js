import React, {Fragment} from 'react';
import PropTypes from 'prop-types';
import './PhotoControl.css';
import MessageStore from '../../Stores/MessageStore';
import {getSize, getFitSize} from '../../Utils/Common';
import {PHOTO_SIZE, PHOTO_DISPLAY_SIZE} from '../../Constants';
import CircularProgress from '@material-ui/core/CircularProgress/CircularProgress';
import DocumentTileControl from '../DocumentTileControl';
import FileController from '../../Controllers/FileController';

const backgroundCircleStyle = { circle: 'photo-progress-circle-background' };
const circleStyle = { circle: 'photo-progress-circle' };

class PhotoControl extends React.Component {
    constructor(props){
        super(props);

        this.onPhotoUpdated = this.onPhotoUpdated.bind(this);
        this.onProgressUpdated = this.onProgressUpdated.bind(this);
    }

    componentWillMount(){
        this.mount = true;
        FileController.on('file_update', this.onProgressUpdated);
        FileController.on('file_upload_update', this.onProgressUpdated);
        MessageStore.on('message_photo_changed', this.onPhotoUpdated)
    }

    onProgressUpdated(payload) {
        if (this.photoSize
            && this.photoSize.photo
            && this.photoSize.photo.id === payload.id){

            payload.blob = this.photoSize.photo.blob;
            this.photoSize.photo = payload;
            this.payload = payload;

            this.forceUpdate();
        }
    }

    componentWillUnmount(){
        FileController.removeListener('file_upload_update', this.onProgressUpdated);
        FileController.removeListener('file_update', this.onProgressUpdated);
        MessageStore.removeListener('message_photo_changed', this.onPhotoUpdated);
        this.mount = false;
    }

    /*shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chat !== this.props.chat){
            return true;
        }

        return false;
    }*/

    onPhotoUpdated(payload) {
        if (this.props.message && this.props.message.id === payload.messageId){
            this.forceUpdate();
        }
    }

    render() {
        this.photoSize = !this.photoSize ? getSize(this.props.message.content.photo.sizes, PHOTO_SIZE) : this.photoSize;
        if (!this.photoSize) return null;

        let fitPhotoSize = getFitSize(this.photoSize, PHOTO_DISPLAY_SIZE);
        if (!fitPhotoSize) return null;

        let file = this.photoSize.photo;

        let isDownloadingActive = file.local && file.local.is_downloading_active;
        let isUploadingActive = file.remote && file.remote.is_uploading_active;
        let isDownloadingCompleted = file.local && file.local.is_downloading_completed;
        let isUploadingCompleted = file.remote && file.remote.is_uploading_completed;

        let progress = 0;
        if (isDownloadingActive){
            progress = file.local.downloaded_size && file.size && this.isDownloadingActive
                ? 100 - (file.size - file.local.downloaded_size) / file.size * 100
                : 1;
        }
        else if (isUploadingActive){
            progress = file.remote.uploaded_size && file.size && this.isUploadingActive
                ? 100 - (file.size - file.remote.uploaded_size) / file.size * 100
                : 1;
        }

        let showProgress = //isDownloadingActive ||
            isUploadingActive;

        let timeToCompleteAnimation = 300;
        if (this.isDownloadingActive && !isDownloadingActive){
            progress = isDownloadingCompleted ? 100 : 0;
            showProgress = true;
            setTimeout(() =>{
                if (!this.mount) return;

                this.forceUpdate();
            }, timeToCompleteAnimation);
        }
        else if (this.isUploadingActive && !isUploadingActive){
            progress = isUploadingCompleted ? 100 : 0;
            showProgress = true;
            setTimeout(() =>{
                if (!this.mount) return;

                this.forceUpdate();
            }, timeToCompleteAnimation);
        }

        let className = 'photo-img';
        let src = '';
        try{
            src = file && file.blob ? URL.createObjectURL(file.blob) : '';
        }
        catch(error){
            console.log(`PhotoControl.render photo with error ${error}`);
        }

        if (!file.blob && this.props.message.content.photo.sizes.length > 0)
        {
            let previewSize = this.props.message.content.photo.sizes[0];
            if (previewSize){
                let previewFile = previewSize.photo;
                if (previewFile && previewFile.blob){
                    className += ' photo-img-blur';
                    try{
                        src = previewFile && previewFile.blob ? URL.createObjectURL(previewFile.blob) : '';
                    }
                    catch(error){
                        console.log(`PhotoControl.render photo with error ${error}`);
                    }
                }
            }
        }

        this.isDownloadingActive = isDownloadingActive;
        this.isUploadingActive = isUploadingActive;

        return (
                <div className='photo-img-wrapper' style={{width: fitPhotoSize.width, height: fitPhotoSize.height}}>
                    <img className={className} width={fitPhotoSize.width} height={fitPhotoSize.height} src={src} alt=''/>
                    {showProgress &&
                        <Fragment>
                            <svg className='photo-tile-circle'>
                                <circle cx='22' cy='22' r='22' fill='black'/>
                            </svg>
                            <svg className='photo-tile-cancel'>
                                <line x1='2' y1='2' x2='16' y2='16' className='document-tile-cancel-line'/>
                                <line x1='2' y1='16' x2='16' y2='2' className='document-tile-cancel-line'/>
                            </svg>
                            <div className='photo-progress' onClick={this.props.openMedia}>
                                <CircularProgress classes={circleStyle} variant='static' value={progress} size={42} thickness={3} />
                            </div>
                        </Fragment>
                    }
                </div>
            );
    }
}

PhotoControl.propTypes = {
    message : PropTypes.object.isRequired,
    openMedia : PropTypes.func.isRequired
};

export default PhotoControl;
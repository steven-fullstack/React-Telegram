/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import BlockIcon from '../../Assets/Icons/Block';
import BroomIcon from '../../Assets/Icons/Broom';
import DeleteIcon from '../../Assets/Icons/Delete';
import GroupIcon from '../../Assets/Icons/Group';
import MoreVertIcon from '../../Assets/Icons/More';
import UnpinIcon from '../../Assets/Icons/PinOff';
import UserIcon from '../../Assets/Icons/User';
import { canClearHistory, canDeleteChat, getViewInfoTitle, isPrivateChat, getDeleteChatTitle, hasOnePinnedMessage, canSwitchBlocked, getChatSender, canManageVoiceChats } from '../../Utils/Chat';
import { clearHistory, leaveChat } from '../../Actions/Chat';
import { getStream } from '../../Calls/Utils';
import { requestBlockSender, unblockSender } from '../../Actions/Message';
import { requestUnpinMessage, showAlert } from '../../Actions/Client';
import AppStore from '../../Stores/ApplicationStore';
import CallStore, { ERROR_CALL, LOG_CALL } from '../../Stores/CallStore';
import ChatStore from '../../Stores/ChatStore';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
import './MainMenuButton.css';
import LStore from '../../Stores/LocalizationStore';

class MainMenuButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            anchorEl: null
        };
    }

    handleButtonClick = async event => {
        const { currentTarget: anchorEl } = event;

        const chatId = AppStore.getChatId();
        const chat = await TdLibController.send({ '@type': 'getChat', chat_id: chatId });
        ChatStore.set(chat);

        this.setState({ anchorEl });
    };

    handleMenuClose = () => {
        this.setState({ anchorEl: null });
    };

    handleChatInfo = () => {
        this.handleMenuClose();
        setTimeout(() => this.props.openChatDetails(), 150);
    };

    handleClearHistory = () => {
        this.handleMenuClose();

        clearHistory(AppStore.getChatId());
    };

    handleDeleteChat = () => {
        this.handleMenuClose();

        leaveChat(AppStore.getChatId());
    };

    handleUnpin = () => {
        this.handleMenuClose();

        const chatId = AppStore.getChatId();

        const media = MessageStore.getMedia(chatId);
        if (!media) return false;

        const { pinned } = media;
        if (!pinned) return false;
        if (pinned.length !== 1) return false;

        requestUnpinMessage(chatId, pinned[0].id);
    };

    handleSwitchBlocked = () => {
        this.handleMenuClose();

        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        const sender = getChatSender(chatId);
        const { is_blocked } = chat;
        if (is_blocked) {
            unblockSender(sender);
        } else {
            requestBlockSender(sender);
        }
    };

    handleGroupCall = async () => {
        this.handleMenuClose();

        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { voice_chat_group_call_id } = chat;
        let groupCall = CallStore.get(voice_chat_group_call_id);
        if (!groupCall) {
            groupCall = await TdLibController.send({
                '@type': 'getGroupCall',
                group_call_id: voice_chat_group_call_id
            });
        }
        LOG_CALL('groupCall', groupCall);
        if (!groupCall) return;

        const { is_joined } = groupCall;
        if (is_joined) {
            await CallStore.leaveGroupCall(chatId, voice_chat_group_call_id);
        } else {
            const muted = true;
            let stream = null;
            try {
                stream = await getStream({ audio: true, video: false }, muted);

            } catch (e) {
                ERROR_CALL('getStream', e);
                showAlert({
                    title: LStore.getString('AppName'),
                    message: LStore.getString('VoipNeedMicPermission'),
                    ok: LStore.getString('OK')
                });
            }
            if (!stream) return;

            await CallStore.joinGroupCall(chatId, voice_chat_group_call_id, stream, muted);
        }
    }

    handleStartGroupCall = () => {
        this.handleMenuClose();

        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        showAlert({
            title: LStore.getString('StartVoipChatTitle'),
            message: LStore.getString('StartVoipChatAlertText'),
            ok: LStore.getString('Start'),
            cancel: LStore.getString('Cancel'),
            onResult: async result => {
                if (result){
                    await CallStore.startGroupCall(chatId);
                }
            }
        })
    };

    render() {
        const { t } = this.props;
        const { anchorEl } = this.state;

        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { is_blocked, voice_chat_group_call_id } = chat;

        const clearHistory = canClearHistory(chatId);
        const deleteChat = canDeleteChat(chatId);
        const deleteChatTitle = getDeleteChatTitle(chatId, t);
        const unpinMessage = hasOnePinnedMessage(chatId);
        const switchBlocked = canSwitchBlocked(chatId);
        const manageVoiceChats = canManageVoiceChats(chatId);

        const groupCall = CallStore.get(voice_chat_group_call_id);

        return (
            <>
                <IconButton
                    aria-owns={anchorEl ? 'simple-menu' : null}
                    aria-haspopup='true'
                    aria-label='Menu'
                    onClick={this.handleButtonClick}>
                    <MoreVertIcon />
                </IconButton>
                <Menu
                    id='main-menu'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleMenuClose}
                    getContentAnchorEl={null}
                    disableAutoFocusItem
                    disableRestoreFocus={true}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                    }}>
                    { Boolean(voice_chat_group_call_id) ? (
                        <MenuItem onClick={this.handleGroupCall}>
                            <ListItemIcon>
                            </ListItemIcon>
                            <ListItemText primary={groupCall && groupCall.is_joined ? t('VoipGroupLeave') : t('VoipChatJoin')} />
                        </MenuItem>
                        ) : manageVoiceChats && (
                        <MenuItem onClick={this.handleStartGroupCall}>
                            <ListItemIcon>
                            </ListItemIcon>
                            <ListItemText primary={t('StartVoipChat')} />
                        </MenuItem>
                    )}
                    {/*{ !Boolean(voice_chat_group_call_id) && manageVoiceChats && (*/}
                    {/*    <MenuItem onClick={this.handleStartGroupCall}>*/}
                    {/*        <ListItemIcon>*/}
                    {/*        </ListItemIcon>*/}
                    {/*        <ListItemText primary={t('StartVoipChat')} />*/}
                    {/*    </MenuItem>*/}
                    {/*)}*/}
                    {/*{ Boolean(voice_chat_group_call_id) && (*/}
                    {/*    <MenuItem onClick={this.handleGroupCall}>*/}
                    {/*        <ListItemIcon>*/}
                    {/*        </ListItemIcon>*/}
                    {/*        <ListItemText primary={groupCall && groupCall.is_joined ? t('VoipGroupLeave') : t('VoipChatJoin')} />*/}
                    {/*    </MenuItem>*/}
                    {/*)}*/}
                    <MenuItem onClick={this.handleChatInfo}>
                        <ListItemIcon>
                            {isPrivateChat(chatId) ? <UserIcon /> : <GroupIcon />}
                        </ListItemIcon>
                        <ListItemText primary={getViewInfoTitle(chatId, t)} />
                    </MenuItem>
                    {clearHistory && (
                        <MenuItem onClick={this.handleClearHistory}>
                            <ListItemIcon>
                                <BroomIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('ClearHistory')} />
                        </MenuItem>
                    )}
                    {deleteChat && deleteChatTitle && (
                        <MenuItem onClick={this.handleDeleteChat}>
                            <ListItemIcon>
                                <DeleteIcon />
                            </ListItemIcon>
                            <ListItemText primary={deleteChatTitle} />
                        </MenuItem>
                    )}
                    {unpinMessage && (
                        <MenuItem onClick={this.handleUnpin}>
                            <ListItemIcon>
                                <UnpinIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('UnpinMessageAlertTitle')} />
                        </MenuItem>
                    )}
                    {switchBlocked && (
                        <MenuItem onClick={this.handleSwitchBlocked}>
                            <ListItemIcon>
                                <BlockIcon />
                            </ListItemIcon>
                            <ListItemText primary={is_blocked ? t('Unblock') : t('BlockContact')} />
                        </MenuItem>
                    )}
                </Menu>
            </>
        );
    }
}

export default withTranslation()(MainMenuButton);

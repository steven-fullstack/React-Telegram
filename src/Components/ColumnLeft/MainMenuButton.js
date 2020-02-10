/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ThemePicker from './ThemePicker';
import LanguagePicker from './LanguagePicker';
import { update } from '../../registerServiceWorker';
import { isAuthorizationReady } from '../../Utils/Common';
import { WASM_FILE_HASH, WASM_FILE_NAME } from '../../Constants';
import ApplicationStore from '../../Stores/ApplicationStore';

const menuAnchorOrigin = {
    vertical: 'bottom',
    horizontal: 'left'
};

class MainMenuButton extends React.Component {
    constructor(props) {
        super(props);

        this.themePickerRef = React.createRef();

        this.state = {
            authorizationState: ApplicationStore.getAuthorizationState(),
            anchorEl: null
        };
    }

    componentDidMount() {
        ApplicationStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
    }

    componentWillUnmount() {
        ApplicationStore.off('updateAuthorizationState', this.onUpdateAuthorizationState);
    }

    onUpdateAuthorizationState = update => {
        this.setState({ authorizationState: update.authorization_state });
    };

    handleMenuOpen = event => {
        const { authorizationState } = this.state;
        if (!isAuthorizationReady(authorizationState)) return;

        this.setState({ anchorEl: event.currentTarget });
    };

    handleMenuClose = () => {
        this.setState({ anchorEl: null });
    };

    handleLogOut = () => {
        this.handleMenuClose();

        this.props.onLogOut();
    };

    handleCheckUpdates = async () => {
        this.handleMenuClose();

        const result = await fetch(`${WASM_FILE_NAME}?_sw-precache=${WASM_FILE_HASH}`);
        console.log('wasm result', result);
        //await update();
    };

    handleAppearance = event => {
        this.handleMenuClose();

        this.themePickerRef.current.open();
    };

    handleLanguage = event => {
        this.handleMenuClose();

        this.languagePicker.open();
    };

    setRef = ref => {
        console.log(this);
        this.languagePicker = ref;
    };

    render() {
        const { t } = this.props;
        const { anchorEl, authorizationState } = this.state;

        const mainMenuControl = isAuthorizationReady(authorizationState) ? (
            <>
                <Menu
                    id='main-menu'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleMenuClose}
                    getContentAnchorEl={null}
                    disableAutoFocusItem
                    disableRestoreFocus={true}
                    anchorOrigin={menuAnchorOrigin}>
                    <MenuItem onClick={this.handleCheckUpdates}>{t('UpdateTelegram')}</MenuItem>
                    <MenuItem onClick={this.handleAppearance}>{t('Appearance')}</MenuItem>
                    <MenuItem onClick={this.handleLanguage}>{t('Language')}</MenuItem>
                    <MenuItem onClick={this.handleLogOut}>{t('LogOut')}</MenuItem>
                </Menu>
            </>
        ) : null;

        return (
            <>
                <IconButton
                    aria-owns={anchorEl ? 'simple-menu' : null}
                    aria-haspopup='true'
                    className='header-left-button'
                    aria-label='Menu'
                    onClick={this.handleMenuOpen}>
                    <MenuIcon />
                </IconButton>
                {mainMenuControl}
                <ThemePicker ref={this.themePickerRef} />
                <LanguagePicker ref={ref => (this.languagePicker = ref)} />
            </>
        );
    }
}

export default withTranslation()(MainMenuButton);

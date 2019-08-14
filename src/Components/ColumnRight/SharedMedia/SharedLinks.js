/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import SharedMediaBase from './SharedMediaBase';
import './SharedLinks.css';

class SharedLinks extends SharedMediaBase {
    isValidContent(content) {
        return content && content['@type'] === 'messageText';
    }

    getSearchFilter() {
        return { '@type': 'searchMessagesFilterUrl' };
    }

    getHeader() {
        const { t } = this.props;

        return t('LinksTitle');
    }
}

SharedLinks.propTypes = {
    chatId: PropTypes.number.isRequired,
    migratedChatId: PropTypes.number,
    onClose: PropTypes.func.isRequired,
    popup: PropTypes.bool,
    minHeight: PropTypes.number
};

SharedLinks.defaultProps = {
    popup: false,
    minHeight: 0
};

const enhance = compose(
    withStyles(SharedMediaBase.getStyles),
    withTranslation()
);

export default enhance(SharedLinks);

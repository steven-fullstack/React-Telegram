/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ArrowBackIcon from '../../Assets/Icons/Back';
import CloseIcon from '../../Assets/Icons/Close';
import User from '../Tile/User';
import SearchInput from './Search/SearchInput';
import VirtualizedList from '../Additional/VirtualizedList';
import { loadUsersContent } from '../../Utils/File';
import { debounce, throttle } from '../../Utils/Common';
import { getUserFullName } from '../../Utils/User';
import CacheStore from '../../Stores/CacheStore';
import FileStore from '../../Stores/FileStore';
import TdLibController from '../../Controllers/TdLibController';
import './Contacts.css';

class UserListItem extends React.Component {
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { userId, selected, style } = this.props;
        if (nextProps.userId !== userId) {
            return true;
        }

        if (nextProps.selected !== selected) {
            return true;
        }

        if (nextProps.style.top !== style.top) {
            return true;
        }

        return false;
    }

    render() {
        const { userId, selected, onClick, style } = this.props;

        return (
            <ListItem className='user-list-item' onClick={() => onClick(userId)} button style={style}>
                <Checkbox className='user-list-item-checkbox' checked={selected} color='primary' />
                <User userId={userId} />
            </ListItem>
        );
    }
}

class AddParticipants extends React.Component {
    constructor(props) {
        super(props);

        this.titleRef = React.createRef();
        this.searchInputRef = React.createRef();
        this.listRef = React.createRef();
        this.searchListRef = React.createRef();

        this.state = {
            items: null,
            searchItems: null,
            selectedItems: new Map()
        };

        this.handleDebounceScroll = debounce(this.handleDebounceScroll, 100, false);
        this.handleThrottleScroll = throttle(this.handleThrottleScroll, 200, false);
    }

    getUserIds() {
        return this.state.selectedItems;
    }

    componentDidMount() {
        const { current } = this.searchInputRef;
        if (current) {
            setTimeout(() => current.focus(), 50);
        }

        this.loadContent();
    }

    handleScroll = event => {
        this.handleDebounceScroll();
        this.handleThrottleScroll();
    };

    handleDebounceScroll() {
        this.loadRenderIdsContent();
    }

    handleThrottleScroll() {
        this.loadRenderIdsContent();
    }

    loadRenderIdsContent = () => {
        const { items, searchItems } = this.state;

        const currentItems = searchItems || items;

        const { current } = currentItems === searchItems ? this.searchListRef : this.listRef;
        if (!current) return;

        const renderIds = current.getListRenderIds();
        if (renderIds.size > 0) {
            const userIds = [];
            [...renderIds.keys()].forEach(key => {
                userIds.push(currentItems.user_ids[key]);
            });

            const store = FileStore.getStore();
            loadUsersContent(store, userIds);
        }
    };

    async loadContent() {
        let contacts = CacheStore.contacts;
        if (!contacts) {
            contacts = await TdLibController.send({
                '@type': 'getContacts'
            });
            contacts.user_ids = contacts.user_ids.sort((x, y) => getUserFullName(x).localeCompare(getUserFullName(y)));
            CacheStore.contacts = contacts;
        }

        const store = FileStore.getStore();
        loadUsersContent(store, contacts.user_ids.slice(0, 20));

        this.setState({
            items: contacts
        });
    }

    handleOpenUser = userId => {
        const { selectedItems } = this.state;

        if (selectedItems.has(userId)) {
            const newSelectedItems = new Map(selectedItems);
            newSelectedItems.delete(userId);

            this.setState({
                selectedItems: newSelectedItems
            });
        } else {
            const newSelectedItems = new Map(selectedItems);
            newSelectedItems.set(userId, userId);

            this.setState({
                selectedItems: newSelectedItems
            });
        }
    };

    renderItem = ({ index, style }, items, selectedItems) => {
        const userId = items.user_ids[index];
        const isSelected = selectedItems.has(userId);

        return <UserListItem key={userId} userId={userId} selected={isSelected} onClick={() => this.handleOpenUser(userId)} style={style} />;
    };

    handleSearch = async text => {
        const query = text.trim();
        if (!query) {
            this.setState({
                searchItems: null
            });
            return;
        }

        const searchItems = await TdLibController.send({
            '@type': 'searchContacts',
            query,
            limit: 1000
        });
        searchItems.user_ids = searchItems.user_ids.sort((x, y) =>
            getUserFullName(x).localeCompare(getUserFullName(y))
        );

        const store = FileStore.getStore();
        loadUsersContent(store, searchItems.user_ids.slice(0, 20));

        this.setState({ searchItems });
    };

    handleClose = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateNewGroup',
            open: false
        });
    };

    render() {
        const { popup } = this.props;
        const { items, searchItems, selectedItems } = this.state;

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={this.handleClose}>
                        { popup ? <CloseIcon/> : <ArrowBackIcon /> }
                    </IconButton>
                    <SearchInput inputRef={this.searchInputRef} onChange={this.handleSearch} />
                </div>
                <div className='contacts-content'>
                    {items && (
                        <VirtualizedList
                            ref={this.listRef}
                            className='contacts-list'
                            source={items.user_ids}
                            rowHeight={72}
                            overScanCount={20}
                            renderItem={x => this.renderItem(x, items, selectedItems)}
                            onScroll={this.handleScroll}
                        />
                    )}
                    {searchItems && (
                        <VirtualizedList
                            ref={this.searchListRef}
                            className='contacts-list contacts-search-list'
                            source={searchItems.user_ids}
                            rowHeight={72}
                            overScanCount={20}
                            renderItem={x => this.renderItem(x, searchItems, selectedItems)}
                            onScroll={this.handleScroll}
                        />
                    )}
                </div>
            </>
        );
    }
}

AddParticipants.propTypes = {
    popup: PropTypes.bool,
    onClose: PropTypes.func
};

export default AddParticipants;

import React from 'react';
import './MessageUserControl.css';
import UserStore from '../Stores/UserStore';
import { getUserFullName } from '../Utils/User';

class MessageUserControl extends React.Component {
    constructor(props){
        super(props);

        this.handleSelectUser = this.handleSelectUser.bind(this);
    }

    handleSelectUser(){
        const user = UserStore.get(this.props.userId);

        this.props.onSelect(user);
    }

    render() {
        const user = UserStore.get(this.props.userId);
        if (!user) return null;

        const fullName = getUserFullName(user) || 'Deleted Account';

        return (
            this.props.onSelect
                ? <a className='message-author' onClick={this.handleSelectUser}>{fullName}</a>
                : <>{fullName}</>
        );
    }
}

export default MessageUserControl;
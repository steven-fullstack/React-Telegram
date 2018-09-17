import { EventEmitter } from 'events';
import TdLibController from '../Controllers/TdLibController';

class UserStore extends EventEmitter{
    constructor(){
        super();

        this.items = new Map();
        this.fullInfoItems = new Map();

        this.onUpdate = this.onUpdate.bind(this);
        TdLibController.on('tdlib_update', this.onUpdate);

        this.setMaxListeners(Infinity);
    }

    onUpdate(update){
        switch (update['@type']) {
            case 'updateUser':{
                this.set(update.user);

                this.emit(update['@type'], update);
                break;
            }
            case 'updateUserFullInfo':
                this.setFullInfo(update.user_id, update.user_full_info);

                this.emit(update['@type'], update);
                break;
            case 'updateUserStatus':{
                let user = this.get(update.user_id);
                if (user){
                    this.assign(user, { status : update.status });
                }

                this.emit(update['@type'], update);
                break;
            }
            default:
                break;
        }
    }

    assign(source1, source2){
        Object.assign(source1, source2);
        //this.set(Object.assign({}, source1, source2));
    }

    get(userId){
        return this.items.get(userId);
    }

    set(user){
        this.items.set(user.id, user);
    }

    getFullInfo(id){
        return this.fullInfoItems.get(id);
    }

    setFullInfo(id, fullInfo){
        this.fullInfoItems.set(id, fullInfo);
    }

    updatePhoto(userId){
        this.emit('user_photo_changed', { userId: userId });
    }
}

const store = new UserStore();

export default store;
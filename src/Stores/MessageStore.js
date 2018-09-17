import { EventEmitter } from 'events';
import TdLibController from '../Controllers/TdLibController';

class MessageStore extends EventEmitter {
    constructor() {
        super();

        this.items = new Map();

        this.onUpdate = this.onUpdate.bind(this);
        TdLibController.on('tdlib_update', this.onUpdate);

        this.setMaxListeners(Infinity);
    }

    onUpdate(update){
        switch (update['@type']) {
            case 'updateNewMessage':
                this.set(update.message);
                this.emit('updateNewMessage', update.message);
                break;
            case 'updateDeleteMessages':
                this.emit('updateDeleteMessages', update);
                break;
            case 'updateMessageEdited':{
                let chat = this.items.get(update.chat_id);
                if (chat){
                    let message = chat.get(update.message_id);
                    if (message){
                        message.reply_markup = update.reply_markup;
                        message.edit_date = update.edit_date;
                    }
                }
                this.emit('updateMessageEdited', update);
                break;
            }
            case 'updateMessageViews':{
                let chat = this.items.get(update.chat_id);
                if (chat){
                    let message = chat.get(update.message_id);
                    if (message && update.views > message.views){
                        message.views = update.views;
                    }
                }
                this.emit('updateMessageViews', update);
                break;
            }
            case 'updateMessageContent':{
                let chat = this.items.get(update.chat_id);
                if (chat){
                    let message = chat.get(update.message_id);
                    if (message){
                        message.content = update.new_content;
                    }
                }
                this.emit('updateMessageContent', update);
                break;
            }
            case 'updateMessageSendSucceeded':{
                let chat = this.items.get(update.message.chat_id);
                if (chat){
                    let message = chat.get(update.old_message_id);
                    if (message){
                        message.sending_state = update.message.sending_state;
                    }
                    if (update.old_message_id !== update.message.id){
                        this.set(update.message);
                    }
                }
                this.emit('updateMessageSendSucceeded', update);
                break;
            }
            case 'updateMessageSendFailed':{
                if (update.message.sending_state){
                    update.message.sending_state.error_code = update.error_code;
                    update.message.sending_state.error_message = update.error_message;
                }

                let chat = this.items.get(update.message.chat_id);
                if (chat){
                    let message = chat.get(update.old_message_id);
                    if (message){
                        message.sending_state = update.message.sending_state;
                        if (message.sending_state){
                            message.sending_state.error_code = update.error_code;
                            message.sending_state.error_message = update.error_message;
                        }
                    }
                    if (update.old_message_id !== update.message.id){
                        this.set(update.message);
                    }
                }
                this.emit('updateMessageSendFailed', update);
                break;
            }
            default:
                break;
        }
    }

    load(chatId, messageId){
        TdLibController
            .send({
                '@type': 'getMessage',
                chat_id: chatId,
                message_id: messageId
            })
            .then(message => {
                this.set(message);
                this.emit('messageLoaded', message);
                /*for (let i = 0; message.length; i++){
                    this.set(message[i]);
                    this.emit('messageLoaded', message[i]);
                }*/
            });
    }

    get(chatId, messageId){
        let chat = this.items.get(chatId);
        if (!chat) {
            this.load(chatId, messageId);
            return null;
        }

        let message = chat.get(messageId);
        if (!message){
            this.load(chatId, messageId);
            return null;
        }

        return message;
    }

    set(message){
        let chat = this.items.get(message.chat_id);
        if (!chat) {
            chat = new Map();
            this.items.set(message.chat_id, chat);
        }

        chat.set(message.id, message);
    }

    setItems(messages){
        for (let i = 0; i < messages.length; i++){
            this.set(messages[i]);
        }
    }

    updateMessagePhoto(messageId){
        this.emit('message_photo_changed', {messageId: messageId});
    }

    updateMessageSticker(messageId){
        this.emit('message_sticker_changed', {messageId: messageId});
    }

    updateMessageDocumentThumbnail(fileId){
        this.emit('message_document_thumbnail_changed', {fileId: fileId});
    }
}

const store = new MessageStore();

export default store;


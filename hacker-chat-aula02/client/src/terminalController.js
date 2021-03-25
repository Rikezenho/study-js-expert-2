import ComponentsBuilder from './components.js';
import { constants } from './constants.js';

class TerminalController {
    #usersColors = new Map();

    constructor() {

    }

    #pickColor() {
        return `#${((1 << 24) * Math.random() | 0).toString(16)}-fg`;
    }

    #getUserColor(userName) {
        if (this.#usersColors.has(userName)) return this.#usersColors.get(userName);

        let newColor = this.#pickColor();
        while (newColor.length < 10) {
            newColor = this.#pickColor();
        }
        this.#usersColors.set(userName, newColor);

        return newColor;
    }

    #onInputReceived(eventEmitter) {
        return function () {
            const message = this.getValue();
            console.log(message);
            this.clearValue();
        }
    }

    #onMessageReceived({ screen, chat }) {
        return msg => {
            const { userName, message } = msg;
            const color = this.#getUserColor(userName);

            chat.addItem(`{${color}}{bold}${userName}{/}{/}: ${message}`);
            screen.render();
        }
    }

    #onLogChanged({ screen, activityLog }) {
        return msg => {
            // user left
            // user join
            const [userName] = msg.split(/\s/);
            const color = this.#getUserColor(userName);

            activityLog.addItem(`{${color}}{bold}${msg.toString()}{/}{/}`);
            screen.render();
        }
    }

    #onStatusUpdated({ screen, status }) {
        return users => {
            const { content: title } = status.items.shift();
            status.clearItems();
            status.addItem(title);

            users.forEach(userName => {
                const color = this.#getUserColor(userName);
                status.addItem(`{${color}}{bold}${userName}{/}{/}`);
            });

            screen.render();
        }
    }

    #registerEvents(eventEmitter, components) {
        eventEmitter.on(constants.events.app.MESSAGE_RECEIVED, this.#onMessageReceived(components));
        eventEmitter.on(constants.events.app.ACTIVITYLOG_UPDATED, this.#onLogChanged(components));
        eventEmitter.on(constants.events.app.STATUS_UPDATED, this.#onStatusUpdated(components));
    }

    async initializeTable(eventEmitter) {
        const components = new ComponentsBuilder()
            .setScreen({ title: 'HackerChat' })
            .setLayoutComponent()
            .setChatComponent()
            .setInputComponent(this.#onInputReceived(eventEmitter))
            .setActivityLogComponent()
            .setStatusComponent()
            .build();

        this.#registerEvents(eventEmitter, components);
        
        components.input.focus();
        components.screen.render();
    }
}

export default TerminalController;
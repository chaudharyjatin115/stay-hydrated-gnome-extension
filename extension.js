import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Clutter from 'gi://Clutter';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const REMINDER_INTERVAL_SECONDS = 60 * 60;
const REMINDER_TITLE = 'Hydration Reminder';
const REMINDER_MESSAGE = 'Time to drink some water 💧';

const WaterReminderIndicator = GObject.registerClass(
class WaterReminderIndicator extends PanelMenu.Button {
    _init(onRemindNow) {
        super._init(0.0, 'Water Reminder');

        const indicatorLabel = new St.Label({
            text: '🥛',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(indicatorLabel);

        this.menu.addMenuItem(new PopupMenu.PopupMenuItem('💧 Hourly Water Reminder'));

        const remindNowItem = new PopupMenu.PopupMenuItem('Remind me now');
        remindNowItem.connect('activate', () => onRemindNow());
        this.menu.addMenuItem(remindNowItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const statusItem = new PopupMenu.PopupMenuItem('Interval: every 60 minutes');
        statusItem.reactive = false;
        statusItem.can_focus = false;
        this.menu.addMenuItem(statusItem);
    }
});

export default class WaterReminderExtension extends Extension {
    enable() {
        this._indicator = new WaterReminderIndicator(() => this._notifyNow());
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        this._startReminderLoop();
        this._notifyNow('Water reminder enabled — I will ping you every hour.');
    }

    disable() {
        this._stopReminderLoop();

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }

    _startReminderLoop() {
        this._stopReminderLoop();

        this._timeoutId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            REMINDER_INTERVAL_SECONDS,
            () => {
                this._notifyNow();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _stopReminderLoop() {
        if (!this._timeoutId)
            return;

        GLib.Source.remove(this._timeoutId);
        this._timeoutId = null;
    }

    _notifyNow(message = REMINDER_MESSAGE) {
        Main.notify(REMINDER_TITLE, message);
    }
}

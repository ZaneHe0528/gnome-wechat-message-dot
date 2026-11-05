import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {isBlank, withDot} from './pixels.js';

// WeChat 4.1 alternates opaque and fully transparent pixmaps every ~500ms.
// It does not publish NeedsAttention; steady opaque frames end the reminder.
const CLEAR_DELAY_MS = 1800;

export default class WeChatRedDot extends Extension {
    enable() {
        this._icons = new Map();
        this._scan();
        this._scanId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
            this._scan();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _scan() {
        for (const button of Object.values(Main.panel.statusArea)) {
            const actor = button?._icon;
            if (button?._indicator?.id !== 'wechat' || !actor || this._icons.has(actor))
                continue;
            if (typeof actor._createIconFromPixmap !== 'function')
                continue;
            this._attach(actor);
        }
    }

    _attach(actor) {
        const state = {
            original: actor._createIconFromPixmap,
            normal: null,
            unread: false,
            clearId: 0,
            destroyId: 0,
        };
        const cancelClear = () => {
            if (state.clearId) {
                GLib.source_remove(state.clearId);
                state.clearId = 0;
            }
        };
        state.cancelClear = cancelClear;
        actor._createIconFromPixmap = async function (type, size, scaling, factor, variant) {
            // Keep overlay icons and any future non-pixmap paths unchanged.
            if (type === 2)
                return state.original.call(this, type, size, scaling, factor, variant);
            const pixmaps = variant.deep_unpack();
            cancelClear();
            if (isBlank(pixmaps)) {
                state.unread = true;
            } else {
                state.normal = variant;
                if (state.unread) {
                    state.clearId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, CLEAR_DELAY_MS, () => {
                        state.clearId = 0;
                        state.unread = false;
                        this._updateIcon().catch(logError);
                        return GLib.SOURCE_REMOVE;
                    });
                }
            }
            const base = state.normal;
            if (!base)
                return null; // The next visible frame supplies the original image.
            const image = state.unread
                ? new GLib.Variant('a(iiay)', withDot(base.deep_unpack()))
                : base;
            return state.original.call(this, type, size, scaling, factor, image);
        };
        state.destroyId = actor.connect('destroy', () => {
            cancelClear();
            this._icons.delete(actor);
        });
        this._icons.set(actor, state);
        actor._updateIcon().catch(logError);
    }

    disable() {
        if (this._scanId) {
            GLib.source_remove(this._scanId);
            this._scanId = 0;
        }
        for (const [actor, state] of this._icons) {
            state.cancelClear();
            actor.disconnect(state.destroyId);
            actor._createIconFromPixmap = state.original;
            actor._updateIcon().catch(logError);
        }
        this._icons.clear();
    }
}

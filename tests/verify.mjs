import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const pixels = fs.readFileSync('pixels.js', 'utf8').replaceAll('export function', 'function');
const code = fs.readFileSync('extension.js', 'utf8').replace(/^import .*;\n/gm, '').replace('export default class WeChatRedDot', 'class WeChatRedDot');
let seq = 0;
const timers = new Map();
const GLib = {
    PRIORITY_DEFAULT: 0, SOURCE_CONTINUE: true, SOURCE_REMOVE: false,
    Variant: class {constructor(type, data) {this.data = data;} deep_unpack() {return this.data;}},
    timeout_add(priority, delay, fn) {timers.set(++seq, {delay, fn}); return seq;},
    source_remove(id) {timers.delete(id);},
};
const sandbox = {GLib, Extension: class {}, Main: {panel: {statusArea: {}}}, logError: e => {throw e;}};
vm.createContext(sandbox);
vm.runInContext(pixels + '\n' + code + '\nthis.ExtensionClass = WeChatRedDot; this.blankCheck = isBlank;', sandbox);
const opaque = [[22, 22, Array.from({length:22*22*4}, (_, i) => i % 4 === 0 ? 255 : 220)]];
const blank = [[16,16,Array(1024).fill(0)]];
let input = opaque;
let rendered;
let destroyCallback;
const actor = {
    _createIconFromPixmap: async (t,s,c,f,v) => {rendered = v.deep_unpack();},
    _updateIcon() {return this._createIconFromPixmap(0,22,1,1,new GLib.Variant('',input));},
    connect(name, fn) {destroyCallback = fn;return 12;}, disconnect() {},
};
const original = actor._createIconFromPixmap;
const extension = new sandbox.ExtensionClass();
extension._icons = new Map();
extension._attach(actor);
await actor._updateIcon();
assert.equal(rendered, opaque);
input = blank;
await actor._updateIcon();
assert.equal(rendered[0][0], 22);
assert.equal(rendered[0][2][(15*22+7)*4+1],59);
assert.equal(opaque[0][2][(15*22+7)*4+1],220);
for (let n=0;n<6;n++) {
    input = opaque; await actor._updateIcon();
    assert.equal(timers.size,1);
    input = blank; await actor._updateIcon();
    assert.equal(timers.size,0);
}
input = opaque; await actor._updateIcon();
const [id,timer] = [...timers][0];timers.delete(id);timer.fn();
assert.equal(rendered,opaque);
input=blank;await actor._updateIcon();
extension.disable();
assert.equal(actor._createIconFromPixmap,original);
assert.equal(rendered,blank);
assert.equal(timers.size,0);
console.log('PASS: normal, transparent-frame replacement, steady blue dot during blinking, clear after steady normal, source pixels unchanged, disable restores original.');

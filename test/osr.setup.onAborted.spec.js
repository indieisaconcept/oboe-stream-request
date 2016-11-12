import test from 'ava';
import oboeStreamRequest from '../';
import { EventEmitter } from 'events';

const setup = oboeStreamRequest.setup;

test('is a function', (t) => {

    let onAborted = setup({}, {}).onAborted;

    t.is(typeof onAborted, 'function');
    t.is(onAborted.length, 0, 'has an arity of 0');
});

test.cb('calls req.abort', (t) => {

    let emitter   = new EventEmitter(),
        onAborted = setup({
            abort : () => {
                t.end();
            }
        }, emitter).onAborted;

    onAborted();
});

test.cb('emits an "aborted" event when called', (t) => {

    let emitter   = new EventEmitter(),
        onAborted = setup({ abort : () => {} }, emitter).onAborted,
        error     = new Error('HTTP request aborted');

    emitter.on('aborted', (context) => {

        t.is(typeof context, 'object');
        t.deepEqual(Object.keys(context), ['statusCode', 'body', 'jsonBody', 'thrown']);
        t.deepEqual(context.thrown, error);
        t.end();
    });

    onAborted();
});

import test from 'ava';
import oboeStreamRequest from '../';
import { EventEmitter } from 'events';

const noop = () => {};

test('is a function', (t) => {

    t.is(typeof oboeStreamRequest, 'function');
    t.is(oboeStreamRequest.length, 2, 'has an arity of 2');
});

test('throws an error if less then 2 arguments supplied', (t) => {

    t.throws(
        oboeStreamRequest,
        'oboe-stream-request, expects 2 arguments'
    );
});

test('returns a function', (t) => {

    let oboe = oboeStreamRequest(noop, noop);

    t.is(typeof oboe, 'function');
    t.is(oboe.length, 1, 'has an arity of 1');
});

test.cb('=> fn : calls request with correct arguments', (t) => {

    let emitter = new EventEmitter(),
        url     = 'http://www.domain.com.au/index.json',

        oboe    = oboeStreamRequest(() => {
            return emitter;
        }, (reqOptions) => {

            t.is(reqOptions, url);
            t.end();

            return emitter;
        });

    oboe(url);
});

test.cb('=> fn : calls oboe', (t) => {

    let emitter = new EventEmitter(),
        url     = 'http://www.domain.com.au/index.json',

        oboe    = oboeStreamRequest(() => {
            t.end();
            return emitter;
        }, (reqOptions) => { return emitter; });

    oboe(url);
});

test.cb('=> fn : calls self.setup with correct arguments', (t) => {

    const originalSetup = oboeStreamRequest.setup;

    let emitter = new EventEmitter(),
        url     = 'http://www.domain.com.au/index.json',
        oboe    = oboeStreamRequest(
            () => { return emitter; },
            () => { return emitter; }
        );

    oboeStreamRequest.setup = (req, oboeStream) => {

        oboeStreamRequest.setup = originalSetup;

        t.deepEqual(req, emitter, 'req is passed correctly');
        t.deepEqual(oboeStream, emitter, 'oboeStream is passed correctly');
        t.end();

        return originalSetup();
    };

    oboe(url);
});

test('=> fn : returns an emitter', (t) => {

    let emitter = new EventEmitter(),
        url     = 'http://www.domain.com.au/index.json',
        oboe    = oboeStreamRequest(
            () => { return emitter; },
            (reqOptions) => { return emitter; }
        );

    t.deepEqual(oboe(url), emitter);
});

function createSetupTest (options) {

    const originalSetup = oboeStreamRequest.setup;

    return (t) => {

        let emitter = {
                request : new EventEmitter(),
                oboe    : new EventEmitter()
            },
            url     = 'http://www.domain.com.au/index.json',

            oboe    = oboeStreamRequest(
                () => { return emitter.oboe; },
                () => { return emitter.request; }
            );

        oboeStreamRequest.setup = (req, oboeStream) => {

            oboeStreamRequest.setup = originalSetup;

            let handlers = originalSetup();
            handlers[options.handler] = () => { t.end(); };

            return handlers;
        };

        oboe(url);
        emitter[options.emitter].emit(options.event);
    };
}

test.cb(
    '=> fn : onResponse handler called when req "response" event emitted',
    createSetupTest({
        emitter : 'request',
        event   : 'response',
        handler : 'onResponse'
    })
);

test.cb(
    '=> fn : onError handler called when req "error" event emitted',
    createSetupTest({
        emitter : 'request',
        event   : 'error',
        handler : 'onError'
    })
);

test.cb(
    '=> fn : onAborted handler called when oboe "7" (aborted) event emitted',
    createSetupTest({
        emitter : 'oboe',
        event   : '7',
        handler : 'onAborted'
    })
);

import test from 'ava';
import { setup } from '../';

test('is a function', (t) => {

    t.is(typeof setup, 'function');
    t.is(setup.length, 2, 'has an arity of 2');
});

test('returns an object when called with correct methods', (t) => {

    t.deepEqual(Object.keys(setup()), ['onResponse', 'onError', 'onAborted']);
});

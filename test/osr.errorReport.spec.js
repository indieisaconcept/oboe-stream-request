import test from 'ava';
import { errorReport } from '../';

test('is a function', (t) => {

    t.is(typeof errorReport, 'function');
    t.is(errorReport.length, 3, 'has an arity of 3');
});

test('returns an object ( body is non-JSON string )', (t) => {

    let error  = new Error('I am an error'),
        report = errorReport(200, 'foo bar', error);

    t.deepEqual(report, {
        statusCode : 200,
        body       : 'foo bar',
        jsonBody   : undefined,
        thrown     : error
    });
});

test('returns an object ( body is JSON string )', (t) => {

    let error  = new Error('I am an error'),
        report = errorReport(200, '{"foo":"bar"}', error);

    t.deepEqual(report, {
        statusCode : 200,
        body       : '{"foo":"bar"}',
        jsonBody   : { foo : 'bar' },
        thrown     : error
    });
});

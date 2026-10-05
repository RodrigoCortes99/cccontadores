import test from 'node:test';
import assert from 'node:assert/strict';
import {internalPath,quickActions,readable} from '../app/panel/carova/assistant/ux.ts';
test('private source navigation rejects external and encoded authority',()=>{
 for(const url of ['https://evil.test','//evil.test','/\\evil.test','/%2fevil.test','/\nredirect'])assert.equal(internalPath(url),false);
 for(const url of ['/api/carova/brain/files/1/?ticket=signed','/panel/carova/egresos/18'])assert.equal(internalPath(url),true);
});
test('six natural language actions and explicit missing values',()=>{assert.equal(quickActions.length,6);assert.equal(readable(null),'Sin dato');assert.equal(readable('0.01'),'0.01');});

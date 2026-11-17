import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCareerBreakRenderer} from './career-break-renderer-fixture.mjs';

test('real FL-099 patch preserves the approved three-bullet sequence in the render seam',()=>{
  const approved=['Planned break','Morning Brief','Job Copilot'];
  const render=createCareerBreakRenderer();
  assert.deepEqual(render([...approved,'Morning Brief','Job Copilot']),approved);
  assert.throws(()=>render(approved.slice(0,2)),/EXACT3/);
  assert.throws(()=>render([...approved,'Unapproved extra claim']),/EXACT3/);
});

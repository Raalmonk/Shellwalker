const assert = require('node:assert/strict');
const { describe, it } = require('mocha');
const { BuffManager, cdSpeedAt, fofModAt } = require('../src/combat/azureDragonHeart');
const { AA, SW, CC } = require('../src/combat/skills');

function use(skill: any, time: number, mgr: any) {
  return skill.use(time, mgr);
}

describe('azure dragon', () => {
  it('SW with AA synergy', () => {
    const mgr = new BuffManager();
    use(AA, 0, mgr);
  use(SW, 1, mgr);
  mgr.advance(1);
  assert.equal(cdSpeedAt(mgr, 1).toFixed(2), (1 + 0.75).toFixed(2));
  mgr.advance(2);
  const cdSpd = cdSpeedAt(mgr, 2);
  const expected = 1 + 2.625;
  assert.ok(Math.abs(cdSpd - expected) < 1e-6);
    const fofMod = fofModAt(mgr, 2);
    assert.equal(fofMod, 0.25);
  });

  it('CC overrides AA and blessing extension', () => {
    const mgr = new BuffManager();
    use(AA, 0, mgr);
    use(CC, 2, mgr);
    mgr.advance(6);
    assert.equal(mgr.activeDragons(6).length, 1);
    const b = mgr.blessing(6);
    assert.ok(b);
    assert.equal(b.hasteMult, 1.15);
    mgr.advance(12);
    assert.ok(b.end >= 10);
  });
});

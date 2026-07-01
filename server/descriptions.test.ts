import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { descStats, isSteeringDoc, LOG_MARKER, DESC_MAX_CHARS } from '../src/lib/descriptions'

test('a tight contract is within budget', () => {
  const s = descStats('Goal: compute the impact zone when a node changes.\nNon-goals: no UI editor.')
  assert.equal(s.overBudget, false)
  assert.deepEqual(s.reasons, [])
})

test('an over-long contract is flagged (not truncated)', () => {
  const s = descStats('x'.repeat(DESC_MAX_CHARS + 50))
  assert.equal(s.overBudget, true)
  assert.ok(s.reasons.some((r) => r.includes('chars')))
})

test('history below the log marker does NOT count against the contract budget', () => {
  const contract = 'Goal: keep it tight.'
  const log = Array.from({ length: 3 }, (_, i) => `2026-07-0${i + 1}: decided X because Y`).join('\n')
  const s = descStats(`${contract}\n${LOG_MARKER}\n${log}`)
  assert.equal(s.chars, contract.length, 'only the contract portion is measured for chars')
  assert.equal(s.logLines, 3)
  assert.equal(s.overBudget, false)
})

test('too many log entries are flagged', () => {
  const log = Array.from({ length: 8 }, (_, i) => `2026-07-0${i}: note ${i}`).join('\n')
  const s = descStats(`Goal: tight.\n${LOG_MARKER}\n${log}`)
  assert.equal(s.overBudget, true)
  assert.ok(s.reasons.some((r) => r.includes('log')))
})

test('empty description is within budget', () => {
  assert.equal(descStats(undefined).overBudget, false)
  assert.equal(descStats('').overBudget, false)
})

test('only the Meta/Project Context node is treated as a steering doc (budget-exempt)', () => {
  assert.equal(isSteeringDoc('Project Context', 'Meta'), true)
  assert.equal(isSteeringDoc('project context', 'meta'), true) // case-insensitive
  assert.equal(isSteeringDoc('Project Context', 'Agent & MCP'), false) // wrong module
  assert.equal(isSteeringDoc('Checkout', 'Meta'), false) // wrong feature
})

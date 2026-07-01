import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { createHmac } from 'node:crypto'
import { githubAdapter } from './github'
import { gitlabAdapter } from './gitlab'
import { getAdapter, listProviders, pathMatches } from './index'

test('registry resolves known providers and rejects unknown', () => {
  assert.equal(getAdapter('github'), githubAdapter)
  assert.equal(getAdapter('GitLab'), gitlabAdapter) // case-insensitive
  assert.equal(getAdapter('bitbucket'), undefined)
  assert.deepEqual(listProviders().sort(), ['github', 'gitlab'])
})

test('pathMatches: exact, directory-prefix (either direction), and non-match', () => {
  assert.equal(pathMatches('src/lib/impact.ts', 'src/lib/impact.ts'), true)
  assert.equal(pathMatches('src/lib/', 'src/lib/impact.ts'), true) // ref dir catches file
  assert.equal(pathMatches('src/lib', 'src/lib/impact.ts'), true)
  assert.equal(pathMatches('src/lib/impact.ts', 'src/lib'), true) // push dir catches file ref
  assert.equal(pathMatches('src/lib/impact.ts', 'src/store/seed.ts'), false)
  assert.equal(pathMatches('', 'x'), false)
})

test('github adaptor verifies HMAC-SHA256 and parses a push into changed paths', () => {
  const secret = 's3cr3t'
  const payload = {
    ref: 'refs/heads/main',
    after: 'abc1234def',
    compare: 'https://github.com/o/r/compare/x...y',
    head_commit: { message: 'fix impact', url: 'https://github.com/o/r/commit/abc' },
    commits: [{ modified: ['src/lib/impact.ts'], added: ['server/webhook.ts'], removed: [] }],
  }
  const raw = Buffer.from(JSON.stringify(payload))
  const sig = 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex')

  assert.equal(githubAdapter.verify(raw, { 'x-hub-signature-256': sig }, secret), true)
  assert.equal(githubAdapter.verify(raw, { 'x-hub-signature-256': 'sha256=deadbeef' }, secret), false)
  assert.equal(githubAdapter.verify(raw, {}, undefined), true, 'no secret configured → accept (dev)')

  const change = githubAdapter.parse(payload, { 'x-github-event': 'push' })
  assert.ok(change)
  assert.equal(change!.provider, 'github')
  assert.equal(change!.headSha, 'abc1234def')
  assert.deepEqual(change!.changedPaths.sort(), ['server/webhook.ts', 'src/lib/impact.ts'])
  assert.equal(githubAdapter.parse(payload, { 'x-github-event': 'ping' }), null, 'non-push ignored')
})

test('gitlab adaptor verifies the token and parses a Push Hook', () => {
  const secret = 'glabtoken'
  const payload = {
    ref: 'refs/heads/main',
    checkout_sha: 'sha999',
    project: { web_url: 'https://gitlab.com/o/r' },
    commits: [{ modified: ['src/store/board.ts'], message: 'tweak', url: 'https://gitlab.com/o/r/-/commit/sha999' }],
  }
  const raw = Buffer.from(JSON.stringify(payload))
  assert.equal(gitlabAdapter.verify(raw, { 'x-gitlab-token': secret }, secret), true)
  assert.equal(gitlabAdapter.verify(raw, { 'x-gitlab-token': 'wrong' }, secret), false)

  const change = gitlabAdapter.parse(payload, { 'x-gitlab-event': 'Push Hook' })
  assert.ok(change)
  assert.equal(change!.headSha, 'sha999')
  assert.deepEqual(change!.changedPaths, ['src/store/board.ts'])
})

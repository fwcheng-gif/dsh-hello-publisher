/**
 * Prepare the dsh-hello-publisher fixture for a publish test.
 *
 * Creates a standalone git repository (its own `.git`, independent of any
 * workspace repository), makes one clean initial commit on `main`, and points
 * `origin` at the GitHub repository you intend to publish to.
 *
 * Usage:
 *   node setup.mjs <github-repo-url>
 *   node setup.mjs https://github.com/you/dsh-hello-publisher
 *   node setup.mjs git@github.com:you/dsh-hello-publisher.git
 *   node setup.mjs --status          # show the current git state only
 *
 * The local repo is deliberately independent: the publisher reads `origin` to
 * decide the `owner/repo` slug, so it must be a real GitHub remote URL.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const arg = process.argv[2]

/** Run git in the fixture and return trimmed stdout. */
function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: here,
    encoding: 'utf8',
    stdio: options.quiet === true ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
  }).trim()
}

/** Run git and report failure rather than throwing. */
function tryGit(args) {
  try {
    return { ok: true, out: git(args, { quiet: true }) }
  } catch (error) {
    const stderr = error.stderr === undefined ? '' : String(error.stderr).trim()
    return { ok: false, out: stderr === '' ? String(error.message) : stderr }
  }
}

/**
 * Normalize whatever remote form the operator pasted into an https GitHub URL.
 *
 * The publisher parses `origin` to learn `owner/repo`, and it accepts both ssh
 * and https forms; normalizing here just makes the printed slug obvious.
 */
function toGithubUrl(input) {
  const trimmed = input.trim()
  const scp = /^git@([^:]+):(.+?)(?:\.git)?$/.exec(trimmed)
  if (scp !== null) return `https://${scp[1]}/${scp[2].replace(/\.git$/, '')}.git`
  const ssh = /^ssh:\/\/git@([^/]+)\/(.+?)(?:\.git)?$/.exec(trimmed)
  if (ssh !== null) return `https://${ssh[1]}/${ssh[2].replace(/\.git$/, '')}.git`
  const https = /^https?:\/\/([^/]+)\/([^/]+)\/(.+?)(?:\.git)?$/.exec(trimmed)
  if (https !== null) return `https://${https[1]}/${https[2]}/${https[3].replace(/\.git$/, '')}.git`
  return undefined
}

/** Print the facts the publisher will read. */
function status() {
  const inside = tryGit(['rev-parse', '--is-inside-work-tree'])
  console.log('is git repo :', inside.ok && inside.out === 'true')
  if (!inside.ok || inside.out !== 'true') {
    console.log('-> run: node setup.mjs <github-repo-url>')
    return
  }
  const branch = tryGit(['rev-parse', '--abbrev-ref', 'HEAD'])
  const remote = tryGit(['remote', 'get-url', 'origin'])
  const head = tryGit(['rev-parse', 'HEAD'])
  const dirty = tryGit(['status', '--porcelain'])
  const commits = tryGit(['rev-list', '--count', 'HEAD'])
  console.log('branch      :', branch.ok ? branch.out : `(none) ${branch.out}`)
  console.log('remote      :', remote.ok ? remote.out : `(none) ${remote.out}`)
  console.log('head        :', head.ok ? head.out.slice(0, 12) : '(no commit yet)')
  console.log('commits     :', commits.ok ? commits.out : '0')
  console.log('clean tree  :', dirty.ok && dirty.out === '' ? 'yes' : `NO -> ${dirty.out.split('\n').join(', ')}`)
}

if (arg === undefined || arg === '--status') {
  status()
  process.exit(0)
}

const url = toGithubUrl(arg)
if (url === undefined) {
  console.error(`not a recognisable GitHub repository URL: ${arg}`)
  console.error('expected e.g. https://github.com/you/dsh-hello-publisher or git@github.com:you/dsh-hello-publisher.git')
  process.exit(2)
}
const slug = /github\.com\/([^/]+)\/(.+?)\.git$/.exec(url)
console.log(`publisher will read slug: ${slug === null ? '(unparsed)' : `${slug[1]}/${slug[2]}`}`)

if (!existsSync(`${here}/.git`)) {
  git(['init', '-b', 'main'])
  console.log('initialised git repository on branch main')
} else {
  console.log('git repository already present; reusing it')
}

git(['add', '-A'])
const staged = tryGit(['diff', '--cached', '--name-only'])
if (staged.ok && staged.out !== '') {
  // A fixed identity keeps the fixture reproducible on a machine without a
  // global git identity configured.
  git(['-c', 'user.name=dsh-hello-publisher', '-c', 'user.email=hello@example.invalid',
    'commit', '-m', 'Initial commit: dsh-hello-publisher test fixture'])
  console.log('committed the fixture')
} else {
  console.log('nothing new to commit')
}

// Replacing an existing remote must tolerate the first-run case, where
// `git remote remove` exits non-zero because there is nothing to remove.
tryGit(['remote', 'remove', 'origin'])
git(['remote', 'add', 'origin', url])
console.log(`origin set to ${url}`)
console.log('')
status()

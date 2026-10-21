import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(
  new URL('../src/components/RevealObserver/RevealObserver.tsx', import.meta.url),
  'utf8',
)
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

/** Минимальная среда браузера: проверяем доступность содержимого, а не длительности CSS. */
function mount(reduced = false) {
  class Element {
    dataset = { reveal: '' }
    parentElement = null
    constructor(top) {
      this.top = top
    }
    getBoundingClientRect() {
      return { top: this.top }
    }
    closest() {
      return this
    }
  }
  const nodes = [new Element(100), new Element(1200), new Element(1500)]
  const events = new Map()
  const motionEvents = new Map()
  const observed = new Set()
  let onIntersect
  let mutationDisconnected = false
  let cleanup
  const motion = {
    matches: reduced,
    addEventListener: (name, fn) => motionEvents.set(name, fn),
    removeEventListener: (name) => motionEvents.delete(name),
  }
  const context = {
    exports: {},
    require: () => ({ useEffect: (effect) => (cleanup = effect()) }),
    Element,
    HTMLElement: Element,
    window: { IntersectionObserver: true, innerHeight: 1000, matchMedia: () => motion },
    document: {
      body: {},
      querySelectorAll: () => nodes,
      addEventListener: (name, fn) => events.set(name, fn),
      removeEventListener: (name) => events.delete(name),
    },
    IntersectionObserver: class {
      constructor(fn) {
        onIntersect = fn
      }
      observe(el) {
        observed.add(el)
      }
      unobserve(el) {
        observed.delete(el)
      }
      disconnect() {
        observed.clear()
      }
    },
    MutationObserver: class {
      observe() {}
      disconnect() {
        mutationDisconnected = true
      }
    },
  }
  vm.runInNewContext(compiled, context)
  context.exports.RevealObserver()
  return {
    nodes,
    observed,
    events,
    motionEvents,
    intersect: (el) => onIntersect([{ target: el, isIntersecting: true }]),
    reduce: () => {
      motion.matches = true
      motionEvents.get('change')()
      assert.equal(mutationDisconnected, true)
    },
    cleanup: () => cleanup?.(),
  }
}

test('первый экран виден сразу, нижние блоки появляются один раз', () => {
  const env = mount()
  assert.deepEqual(
    env.nodes.map((el) => el.dataset.reveal),
    ['done', 'wait', 'wait'],
  )
  env.intersect(env.nodes[1])
  assert.equal(env.nodes[1].dataset.reveal, 'in')
  assert.equal(env.observed.has(env.nodes[1]), false)
  env.cleanup()
  assert.equal(env.events.size + env.motionEvents.size + env.observed.size, 0)
})

test('клавиатурный фокус сразу показывает скрытый блок и его родителя', () => {
  const env = mount()
  env.nodes[2].parentElement = env.nodes[1]
  env.events.get('focusin')({ target: env.nodes[2] })
  assert.equal(env.nodes[1].dataset.reveal, 'done')
  assert.equal(env.nodes[2].dataset.reveal, 'done')
  assert.equal(env.observed.size, 0)
  env.cleanup()
})

test('включение reduced motion во время просмотра показывает ожидающие блоки', () => {
  const env = mount()
  env.reduce()
  assert.equal(
    env.nodes.every((el) => el.dataset.reveal === 'done'),
    true,
  )
  assert.equal(env.observed.size, 0)
  env.cleanup()
})

test('при исходном reduced motion содержимое не скрывается', () => {
  const env = mount(true)
  assert.equal(
    env.nodes.every((el) => el.dataset.reveal === ''),
    true,
  )
  assert.equal(env.observed.size + env.events.size + env.motionEvents.size, 0)
})

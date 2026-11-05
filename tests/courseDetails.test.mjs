import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
import { detailCandidates } from '../src/domain/courseDetails.mjs'

const courses = [
  {
    id: 1,
    title: 'Онлайн практикум «Autodesk Revit Structure»',
    aliases: [],
    href: '/courses/structure',
  },
  { id: 2, title: 'Autodesk Revit Structure 2027', aliases: [], href: '/courses/structure-2027' },
  { id: 3, title: 'Revit Architecture', aliases: [], href: '/courses/architecture' },
]

// Исполняем настоящий TS-инструмент с подменой только CMS и сетевых зависимостей.
const compiled = ts.transpileModule(
  readFileSync(new URL('../src/lib/assistant/courseDetails.ts', import.meta.url), 'utf8'),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  },
).outputText
function setup(
  description,
  fallback = async () => ({ description: 'Армирование и спецификации' }),
  status = 'published',
) {
  let reads = 0
  let downloads = 0
  const modules = {
    '@/domain/courseDetails.mjs': { detailCandidates },
    '../courseSchedule': { courseMatches: async () => ({ courses }) },
    '../coursePages': {
      courseLinks: () => new Map([[1, 'https://l-p.kz/courses/detail.php?ID=3387']]),
      readCoursePage: async () => {
        downloads++
        return fallback()
      },
    },
  }
  const exports = {}
  new Function('require', 'exports', compiled)((name) => {
    assert.ok(modules[name], name)
    return modules[name]
  }, exports)
  return {
    run: (query = '', id = 1) =>
      exports.courseDetails(
        {
          findByID: async () => {
            reads++
            return { description, kind: 'course', status }
          },
        },
        query,
        id,
      ),
    counts: () => ({ reads, downloads }),
  }
}

test('точное название и ID отделяют практикум от Structure 2027; общий запрос требует выбора', () => {
  assert.deepEqual(
    detailCandidates(courses, courses[0].title).map((c) => c.id),
    [1],
  )
  assert.deepEqual(
    detailCandidates(courses, 'Revit Structure').map((c) => c.id),
    [1, 2],
  )
  assert.deepEqual(
    detailCandidates(courses, '', 3).map((c) => c.id),
    [3],
  )
  assert.deepEqual(detailCandidates(courses, ''), [])
})

test('полная программа CMS передаётся без обрезки до 240 символов и без загрузки страницы', async () => {
  const description = `${'Описание курса. '.repeat(40)}Чему научитесь: армирование. Подготовка: без специальных требований.`
  const tool = setup(description)
  const result = await tool.run()
  assert.equal(result.description, description)
  assert.equal(result.source, 'site')
  assert.equal(result.href, courses[0].href)
  assert.deepEqual(tool.counts(), { reads: 1, downloads: 0 })
})

test('пустое описание получает программу из таблицы; ошибка чтения не выдумывает содержание', async () => {
  const tool = setup(' ')
  assert.equal((await tool.run()).description, 'Армирование и спецификации')
  assert.deepEqual(tool.counts(), { reads: 1, downloads: 1 })
  const failed = setup('', async () => {
    throw new Error('timeout')
  })
  const result = await failed.run()
  assert.equal(result.description, null)
  assert.equal(result.source, null)
  assert.match(result.note, /недоступно/)
})

test('неизвестный ID и снятый с публикации курс не раскрывают описание', async () => {
  const tool = setup('Закрытое описание', undefined, 'draft')
  assert.ok((await tool.run()).error)
  const unknown = await tool.run('', 999)
  assert.deepEqual(unknown.courses, [])
  assert.deepEqual(tool.counts(), { reads: 1, downloads: 0 })
})

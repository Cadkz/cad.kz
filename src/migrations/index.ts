import * as migration_20261008_112430_initial from './20261008_112430_initial'

export const migrations = [
  {
    up: migration_20261008_112430_initial.up,
    down: migration_20261008_112430_initial.down,
    name: '20261008_112430_initial',
  },
]

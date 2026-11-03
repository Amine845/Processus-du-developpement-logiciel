import { describe, expect, it } from 'vitest'
import { createLatestRequest } from './latest-request'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('createLatestRequest', () => {
  it('ignore une réponse tardive d’une recherche plus ancienne', async () => {
    const latest = createLatestRequest()
    const slow = deferred<string>()
    const fast = deferred<string>()

    const first = latest.run(() => slow.promise)
    const second = latest.run(() => fast.promise)

    fast.resolve('récent')
    expect(await second).toEqual({ stale: false, value: 'récent' })
    slow.resolve('ancien')
    expect(await first).toEqual({ stale: true })
  })

  it('annule le signal de la requête précédente', async () => {
    const latest = createLatestRequest()
    let firstSignal!: AbortSignal
    const pending = latest.run((signal) => {
      firstSignal = signal
      return new Promise<string>(() => {})
    })
    void pending
    void latest.run(async () => 'b')
    expect(firstSignal.aborted).toBe(true)
  })

  it('traite l’erreur d’une requête dépassée comme périmée, pas la dernière', async () => {
    const latest = createLatestRequest()
    const old = deferred<string>()
    const stale = latest.run(() => old.promise)
    const current = latest.run(() => Promise.reject(new Error('panne')))
    old.reject(new Error('abort'))
    expect(await stale).toEqual({ stale: true })
    await expect(current).rejects.toThrow('panne')
  })

  it('cancel() rend la requête en cours périmée', async () => {
    const latest = createLatestRequest()
    const pending = deferred<string>()
    const run = latest.run(() => pending.promise)
    latest.cancel()
    pending.resolve('trop tard')
    expect(await run).toEqual({ stale: true })
  })
})

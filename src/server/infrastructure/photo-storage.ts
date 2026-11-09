import { randomBytes } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { InvalidImageError, type PhotoStorage } from '../domain/photo-storage.js'

export const PHOTO_ID_RE = /^[0-9a-f]{32}$/

export function createPhotoStorage(dir: string): PhotoStorage {
    const fileOf = (id: string) => path.join(dir, `${id}.webp`)
    return {
        /** Compresse en WebP (max 1200px) et retourne l'id hexa généré. */
        async save(input: Buffer): Promise<string> {
            let output: Buffer
            try {
                output = await sharp(input)
                    .rotate() // applique l'orientation EXIF
                    .resize({
                        width: 1200,
                        height: 1200,
                        fit: 'inside',
                        withoutEnlargement: true,
                    })
                    .webp({ quality: 80 })
                    .toBuffer()
            } catch {
                throw new InvalidImageError()
            }
            const id = randomBytes(16).toString('hex')
            await mkdir(dir, { recursive: true })
            await writeFile(fileOf(id), output)
            return id
        },
        async read(id: string): Promise<Buffer | null> {
            if (!PHOTO_ID_RE.test(id)) return null
            try {
                return await readFile(fileOf(id))
            } catch {
                return null
            }
        },
        async remove(id: string | null | undefined): Promise<void> {
            if (!id || !PHOTO_ID_RE.test(id)) return
            await unlink(fileOf(id)).catch(() => { })
        },
    }
}
export interface PhotoStorage {
    save(input: Buffer): Promise<string>
    read(id: string): Promise<Buffer | null>
    remove(id: string | null | undefined): Promise<void>
}

export class InvalidImageError extends Error {
    constructor() {
        super('Invalid image')
        this.name = 'InvalidImageError'
    }
}
import { prisma } from './prisma'

export const recipeRepository = {
    async findAll() {
        return prisma.recipe.findMany({
            include: {
                ingredients: {
                    include: { ingredient: true },
                    orderBy: { position: 'asc' },
                },
                steps: {
                    orderBy: { position: 'asc' },
                },
            },
        })
    },

    async findById(id: number) {
        return prisma.recipe.findUnique({
            where: { id },
            include: {
                ingredients: {
                    include: { ingredient: true },
                    orderBy: { position: 'asc' },
                },
                steps: {
                    orderBy: { position: 'asc' },
                },
            },
        })
    },

    async delete(id: number) {
        return prisma.recipe.delete({
            where: { id },
        })
    },
}
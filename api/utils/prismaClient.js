import { PrismaClient } from './generated/prisma'

export const prisma = new PrismaClient()

module.exports = { prisma }
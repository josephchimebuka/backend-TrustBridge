import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import { generateToken } from "../middleware/auth.middleware";
import crypto from 'crypto';

const prisma = new PrismaClient();

interface Context {
    user?: {
        id: string;
        email: string;
    }
}

interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    walletAddress: string;
    roleIds: string[];
}

interface UpdateUserInput {
    name?: string;
    email?: string;
    walletAddress?: string;
}

export const userResolvers = {
    Query: {
        getUser: async (_parent: unknown, { id }: { id: string }, { user }: Context) => {
            if (!user) throw new GraphQLError('Unauthorized');
            return prisma.user.findUnique({
                where: { id },
                include: {
                    roles: {
                        include: { role: true }
                    },
                    loans: true,
                    reputation: true
                }
            });
        },
        getCurrentUser: async (_parent: unknown, _args: unknown, { user }: Context) => {
            if (!user) throw new GraphQLError('Unauthorized');
            return prisma.user.findUnique({
                where: { id: user.id },
                include: {
                    roles: {
                        include: { role: true }
                    },
                    loans: true,
                    reputation: true
                }
            });
        },
        getAllUsers: async (_parent: unknown, _args: unknown, { user }: Context) => {
            if (!user) throw new GraphQLError('Unauthorized');
            return prisma.user.findMany({
                include: {
                    roles: {
                        include: { role: true }
                    }
                }
            });
        }
    },
    Mutation: {
        registerUser: async (_parent: unknown, { input }: { input: CreateUserInput }) => {
            const { name, email, password, walletAddress, roleIds } = input;

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                throw new GraphQLError('User already exists');
            }

            // Validate and fetch roles
            const roles = await prisma.role.findMany({
                where: {
                    id: { in: roleIds },
                    // If no specific IDs are provided, default to 'USER' role
                    OR: roleIds.length === 0 ? [{ name: 'USER' }] : undefined
                }
            });

            // If no valid roles found, throw an error
            if (roles.length === 0) {
                throw new GraphQLError('Invalid or no roles provided');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Generate a nonce (a random string used for additional security)
            const nonce = crypto.randomBytes(16).toString('hex');

            // Create user with roles
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    walletAddress,
                    nonce, // Add the required nonce
                    roles: {
                        create: roleIds.map((roleId) => ({
                            role: { connect: { id: roleId } }
                        }))
                    }
                },
                include: {
                    roles: {
                        include: { role: true }
                    }
                }
            });

            // Generate tokens
            const token = generateToken(user);
            const refreshToken = generateToken(user, true);

            return { user, token, refreshToken };
        },
        loginUser: async (_parent: unknown, { email, password }: { email: string, password: string }) => {
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    roles: {
                        include: { role: true }
                    }
                }
            });

            if (!user) {
                throw new GraphQLError('Invalid credentials');
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                throw new GraphQLError('Invalid credentials');
            }

            // Generate tokens
            const token = generateToken(user);
            const refreshToken = generateToken(user, true);

            // Update last login
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() }
            });

            return { user, token, refreshToken };
        },
        updateUser: async (_parent: unknown, { id, input }: { id: string, input: UpdateUserInput }, { user }: Context) => {
            if (!user || user.id !== id) {
                throw new GraphQLError('Unauthorized');
            }

            return prisma.user.update({
                where: { id },
                data: input,
                include: {
                    roles: {
                        include: { role: true }
                    },
                    loans: true,
                    reputation: true
                }
            });
        },
        deleteUser: async (_parent: unknown, { id }: { id: string }, { user }: Context) => {
            if (!user || user.id !== id) {
                throw new GraphQLError('Unauthorized');
            }

            await prisma.user.delete({ where: { id } });
            return true;
        }
    }
};
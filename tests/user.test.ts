import { PrismaClient } from '@prisma/client';
import { userResolvers } from '../src/graphql/resolvers/user.resolver';

const prisma = new PrismaClient();

describe('User Resolvers', () => {
    beforeAll(async () => {
        // Setup test database or mock data
    });

    afterAll(async () => {
        // Cleanup
        await prisma.$disconnect();
    });

    test('registerUser should create a new user', async () => {
        const input = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            walletAddress: '0x1234567890',
            roleIds: ['some-role-id']
        };

        const result = await userResolvers.Mutation.registerUser(
            null,
            { input },

        );

        expect(result.user).toBeDefined();
        expect(result.token).toBeDefined();
    });

    // Add more tests...
});
import { Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

import prisma from '../src/services/prismaClient';

async function main() {
  console.log('Seeding database...');

  // Generate random users
  const num_users = 1;
  const users = await Promise.all(
    Array.from({ length: num_users }).map(async () => {
      return prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
        },
      });
    })
  );

  console.log('Users seeded:', users.map(u => u.email));


  // Generate loans and payments for each user
  for (const user of users) {
    const loanAmount = new Prisma.Decimal(faker.number.float({ min: 500, max: 5000 })); // Ensure Decimal type

    const loan = await prisma.loan.create({
      data: {
        userId: user.id,
        amount: loanAmount, // Uses Prisma.Decimal
        status: faker.helpers.arrayElement(['completed', 'ongoing', 'defaulted']),
      },
    });

    console.log(`Loan seeded for ${user.email}`);

    await prisma.payment.createMany({
      data: Array.from({ length: 2 }).map(() => ({
        userId: user.id,
        loanId: loan.id,
        amount: new Prisma.Decimal(faker.number.float({ min: 100, max: loan.amount.toNumber()})), //  Convert Decimal properly
        status: faker.helpers.arrayElement(['paid', 'pending', 'late']),
      })),
    });

    console.log(`Payments seeded for ${user.email}`);

    await prisma.reputation.create({
      data: {
        userId: user.id,
        reputationScore: faker.number.int({ min: 30, max: 100 }),
        trend: faker.helpers.arrayElement(['stable', 'improving', 'declining']),
      },
    });

    console.log(`Reputation seeded for ${user.email}`);

    const creditScore = faker.number.int({ min: 300, max: 850 });

    await prisma.creditScore.create({
      data: {
        userId: user.id,
        score: creditScore,
      },
    });

    console.log(`Credit Score (${creditScore}) seeded for ${user.email}`);
  }

  console.log(' Database seeding completed!');
}

main()
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  })

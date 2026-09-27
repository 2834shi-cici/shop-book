import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma schema & unique constraints', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('TimeSlot', () => {
    it('enforces @@unique([date, startTime]) — second slot with same date+startTime throws', async () => {
      const date = new Date('2026-09-27');

      await prisma.timeSlot.create({
        data: { date, startTime: '09:00', endTime: '09:30' },
      });

      await expect(
        prisma.timeSlot.create({
          data: { date, startTime: '09:00', endTime: '09:30' },
        }),
      ).rejects.toThrow(/Unique constraint/);
    });

    it('allows same startTime on different dates', async () => {
      const date1 = new Date('2026-09-28');
      const date2 = new Date('2026-09-29');

      await prisma.timeSlot.create({
        data: { date: date1, startTime: '10:00', endTime: '10:30' },
      });
      const slot2 = await prisma.timeSlot.create({
        data: { date: date2, startTime: '10:00', endTime: '10:30' },
      });

      expect(slot2.startTime).toBe('10:00');
    });
  });

  describe('Booking', () => {
    it('enforces @@unique([slotId]) — second booking on same slot throws', async () => {
      const customer = await prisma.customer.create({
        data: { openid: 'test-openid-booking' },
      });
      const slot = await prisma.timeSlot.create({
        data: {
          date: new Date('2026-09-30'),
          startTime: '11:00',
          endTime: '11:30',
        },
      });

      await prisma.booking.create({
        data: {
          customerId: customer.id,
          slotId: slot.id,
          petName: 'Buddy',
          petBreed: 'Golden',
        },
      });

      await expect(
        prisma.booking.create({
          data: {
            customerId: customer.id,
            slotId: slot.id,
            petName: 'Buddy2',
            petBreed: 'Labrador',
          },
        }),
      ).rejects.toThrow(/Unique constraint/);
    });
  });

  describe('Staff', () => {
    it('enforces unique username', async () => {
      await prisma.staff.create({
        data: { username: 'tester', passwordHash: 'hash1' },
      });

      await expect(
        prisma.staff.create({
          data: { username: 'tester', passwordHash: 'hash2' },
        }),
      ).rejects.toThrow(/Unique constraint/);
    });
  });
});

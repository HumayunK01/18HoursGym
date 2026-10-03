import { prisma } from '../config/db.js';
import { NotFoundError } from '../types/api.types.js';
import { CreatePlanInput, UpdatePlanInput } from '../types/schemas/plan.schema.js';

export class PlanService {
  static async getActivePlans() {
    return prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  static async getPlanById(id: string) {
    const plan = await prisma.membershipPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundError('Membership plan not found.');
    }

    return plan;
  }

  static async createPlan(input: CreatePlanInput) {
    return prisma.membershipPlan.create({
      data: {
        name: input.name,
        description: input.description,
        durationInDays: input.durationInDays,
        price: input.price,
        features: input.features,
        isActive: input.isActive,
      },
    });
  }

  static async updatePlan(id: string, input: UpdatePlanInput) {
    await this.getPlanById(id);

    return prisma.membershipPlan.update({
      where: { id },
      data: input,
    });
  }
}

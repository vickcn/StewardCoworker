import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { ok, fail } from '@/lib/utils/response';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  eventDate: z.string().optional(),
});

// GET /api/projects — list caller's projects
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return fail('User not found', 404);

  const memberships = await db.projectMember.findMany({
    where: { userId: user.id },
    include: { project: true },
    orderBy: { project: { updatedAt: 'desc' } },
  });

  const projects = memberships.map(({ project, role }) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    eventDate: project.eventDate,
    isArchived: project.isArchived,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    myRole: role,
  }));

  return ok(projects);
}

// POST /api/projects — create a new project
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return fail('User not found', 404);

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) return fail('Invalid input', 400, parsed.error.flatten());

  const { name, description, eventDate } = parsed.data;

  const project = await db.project.create({
    data: {
      name,
      description: description ?? null,
      eventDate: eventDate ?? null,
      members: {
        create: { userId: user.id, role: 'OWNER' },
      },
      publicShare: {
        create: {},
      },
    },
  });

  return ok({ id: project.id, name: project.name }, 201);
}

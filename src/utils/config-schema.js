import { z } from 'zod';

const mountSchema = z.object({
  host: z.string(),
  container: z.string(),
  readonly: z.boolean().optional(),
});

const portSchema = z.object({
  host: z.number().int(),
  container: z.number().int(),
});

export const projectConfigSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    mounts: z.array(mountSchema).optional(),
    ports: z.array(portSchema).optional(),
    environment: z.record(z.string()).optional(),
    working_dir: z.string().optional(),
    shell: z.string().optional(),
    devcontainer: z.string().optional(),
    security: z
      .object({
        max_execution_time: z.number().int().optional(),
      })
      .optional(),
  })
  .passthrough();

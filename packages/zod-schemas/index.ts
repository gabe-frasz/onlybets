import { z } from "zod";

export const userLoginResponseSchema = z.object({
  token: z.string(),
});

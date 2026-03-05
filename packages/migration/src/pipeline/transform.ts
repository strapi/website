import type { TransformFn, TransformContext } from "../transforms/base.ts"

export async function runTransforms(
  entity: Record<string, unknown>,
  transforms: TransformFn[],
  ctx: TransformContext
): Promise<Record<string, unknown>> {
  let result = entity

  for (const transform of transforms) {
    result = await transform(result, ctx)
  }

  return result
}

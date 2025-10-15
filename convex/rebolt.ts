import { ActionCtx } from "./_generated/server";
import { Rebolt } from "@rebolt-ai/convex/v1";
import type { ActionConfig, ActionMap } from "@rebolt-ai/convex/v1/core";

// Example of how to use the helper function. Browse the rebolt SDK docs to get information on the available actions, input and output interfaces.
//
// export const myAction = authenticatedAction(async (ctx) => {
//   const user = await ctx.auth.getUserIdentity();
//   if (!user) {
//     throw new Error("Unauthorized");
//   }
//
//   const actionResult = await runReboltActionHelper(ctx, "EXA_AI_WEB_SEARCH", {
//     query: "What is the capital of France?",
//     num_results: 1,
//   });
//   if (!actionResult.success) {
//      // handle the error
//   }
//   // handle the result
//   return outputs;
// });

export async function runReboltActionHelper<T extends keyof ActionMap>(
  _ctx: ActionCtx,
  actionType: T,
  inputs: Parameters<ActionMap[T]>[0]["inputs"],
  config?: ActionConfig,
): Promise<ReturnType<ActionMap[T]>> {
  const rebolt = new Rebolt();
  try {
    const result = await rebolt.actions[actionType]({
      inputs: inputs as never, // DO NOT EDIT: This is only alloweed
      config,
    });
    return result as ReturnType<ActionMap[T]>;
  } catch (error) {
    return {
      success: false,
      action_id: String(actionType),
      output: null,
      error_message: "We couldn't run your query.",
    } as ReturnType<ActionMap[T]>;
  }
}

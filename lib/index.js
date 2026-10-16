/**
 * dsh-hello-publisher — a deliberately tiny DSH host plugin.
 *
 * This package exists to be *published*, not to be useful: it is the fixture
 * for exercising dsh-github-publisher end to end. It is intentionally small so
 * every file the pipeline touches is easy to inspect by hand.
 *
 * @module dsh-hello-publisher
 */
const name = "hello-publisher";
const inject = ["tools"];

/**
 * Register one trivial tool.
 *
 * The tool is a liveness probe rather than a feature: if it appears in a
 * session, the plugin loaded and its tool registration path works.
 *
 * @param {object} ctx - Cordis context carrying the tool registry.
 * @returns {void}
 */
function apply(ctx) {
  ctx.tools.register({
    name: "hello_publisher",
    description: "Return a greeting. Registered by the dsh-hello-publisher test fixture.",
    parameters: {
      type: "object",
      properties: {
        who: { type: "string", description: "Who to greet. Defaults to the DSH publisher test." },
      },
      additionalProperties: false,
    },
    handler: async (args) => {
      const who = typeof args?.who === "string" && args.who !== "" ? args.who : "dsh-github-publisher";
      return {
        content: [{ type: "text", text: `Hello, ${who}! This fixture is published end to end.` }],
      };
    },
  });
  ctx.logger?.info?.("dsh-hello-publisher loaded");
}

export { apply, inject, name };

// src/index.ts
var inject = ["systemPrompt", "tools"];
function apply(ctx) {
  ctx.systemPrompt.section({
    name: "pcb-diagram-auto-preview",
    order: ctx.systemPrompt.getSectionOrder("TOOL_WRITE"),
    text: ({ scope }) => ctx.tools.get("present", scope) === void 0 ? "" : "After successfully generating or updating a .diagram file using a shell, script, or MCP tool, call present with the final existing file path so its PCB diagram preview can open automatically. Do not present files merely read or mentioned, and do not present failed or incomplete output. Built-in write/edit operations already trigger the diagram preview."
  });
}
export {
  apply,
  inject
};

import { select } from "@inquirer/prompts";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const mcpClient = new Client(
  {
    name: "My MCP Client",
    version: "1.0.0",
  },
  {
    capabilities: {
      sampling: {},
    },
  }
);

const transport = new StdioClientTransport({
  command: "node",
  args: ["build/index.js"],
  stderr: "ignore", //? Means we ignore the stderr output from the server to not show in the client logs
});

await mcpClient.connect(transport);
const [{ tools }, { resources }, { prompts }, { resourceTemplates }] = await Promise.all([
  mcpClient.listTools(),
  mcpClient.listResources(),
  mcpClient.listPrompts(),
  mcpClient.listResourceTemplates(),
]);

console.log("You are connected!");

while (true) {
  const option = await select({
    message: "What do you want to do?",
    choices: ["Query", "Tools", "Resources", "Prompts", "Exit"],
  });

  switch (option) {
    case "Query": {
    }
    case "Tools": {
    }
    case "Resources": {
    }
    case "Prompts": {
    }
    case "Exit":
      console.log("Goodbye!");
      process.exit(0);
  }
}

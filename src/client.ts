import { input, select } from "@inquirer/prompts";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

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
  args: ["dist/index.js"],
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

const handleTool = async (tool: Tool) => {
  const args: Record<string, string> = {};
  for (const [key, value] of Object.entries(tool.inputSchema.properties ?? {})) {
    args[key] = await input({
      message: `Enter value for ${key} (${(value as { type: string }).type}):`,
    });
  }
  const res = await mcpClient.callTool({
    name: tool.name,
    arguments: args,
  });
  console.log((res.content as [{ text: string }])[0].text);
};
const handleResource = async (uri: string) => {
  let finalUri = uri;
  console.log(uri);
  const paramMatches = uri.match(/{([^}]+)}/g); //? Find all {param} in the URI
  console.log(paramMatches);

  if (paramMatches) {
    for (const paramMatch of paramMatches) {
      const paramName = paramMatch.slice(1, -1); //? Remove the { and } from the match
      const paramValue = await input({
        message: `Enter value for ${paramName}: `,
      });
      finalUri = finalUri.replace(paramMatch, paramValue);
    }
  }
  const res = await mcpClient.readResource({
    uri: finalUri,
  });
  console.log(JSON.stringify(JSON.parse(res.contents[0].text as string), null, 2));
};

const handlePrompt = async (prompt: any) => {};

while (true) {
  const option = await select({
    message: "What do you want to do?",
    choices: ["Query", "Tools", "Resources", "Prompts", "Exit"],
  });

  switch (option) {
    case "Query": {
      break;
    }
    case "Tools": {
      const toolName = await select({
        message: "Select a tool",
        choices: tools.map((tool) => ({
          name: tool.annotations?.title || tool.name,
          value: tool.name,
          description: tool.description,
        })),
      });
      const tool = tools.find((t) => t.name === toolName);
      if (!tool) {
        throw new Error("Tool not found");
      } else {
        await handleTool(tool);
      }
      break;
    }
    case "Resources": {
      const resourceUri = await select({
        message: "Select a resource",
        choices: [
          ...resources.map((resource) => ({
            name: resource.name,
            value: resource.uri,
            description: resource.description,
          })),
          ...resourceTemplates.map((template) => ({
            name: template.name,
            value: template.uriTemplate,
            description: template.description,
          })),
        ],
      });
      const uri =
        resources.find((r) => r.uri === resourceUri)?.uri ??
        resourceTemplates.find((t) => t.uriTemplate === resourceUri)?.uriTemplate;
      console.log(resources);
      if (!uri) {
        throw new Error("Resource not found");
      } else {
        await handleResource(uri);
      }
      break;
    }
    case "Prompts": {
      const promptName = await select({
        message: "Select a prompt",
        choices: prompts.map((prompt) => ({
          name: prompt.name,
          value: prompt.name,
          description: prompt.description,
        })),
      });
      const prompt = prompts.find((p) => p.name === promptName);
      if (!prompt) {
        throw new Error("Prompt not found");
      } else {
        await handlePrompt(prompt);
      }
      break;
    }
    case "Exit":
      console.log("Goodbye!");
      process.exit(0);
  }
}

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createUser, getUsers, ICreateUserParams } from "./lib/helpers/user.js";

const server = new McpServer({
  name: "My MCP Server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
    // prompts: {},
  },
});

//* ----------------------------------- Resources ----------------------------------- *//

server.resource(
  "users",
  "users:///all",
  {
    name: "All Users",
    description: "Get all users data from the database",
    mimeType: "application/json",
  },
  async (uri) => {
    const users = await getUsers();
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(users, null, 2),
          mimeType: "application/json",
        },
      ],
    };
  }
);

server.resource(
  "user-details",
  new ResourceTemplate("users:///{userId}/profile", {
    list: undefined, //? This resource does not support listing
  }),
  {
    name: "User Details",
    description: "Get a user's details from the database by user ID",
    mimeType: "application/json",
  },
  async (uri, { userId }) => {
    const users = await getUsers();
    const user = users.find((u) => u.id === parseInt(userId as string));
    if (!user) {
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify({ error: "User not found" }, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(user, null, 2),
          mimeType: "application/json",
        },
      ],
    };
  }
);

//* ----------------------------------- Tools ----------------------------------- *//

const createUserSchema = {
  name: z.string(),
  email: z.string().email(),
  address: z.string(),
  phone: z.string(),
};

server.tool(
  "create-user",
  {
    ...createUserSchema,
    title: "Create User",
    description: "Creates a new user in the database",
    readOnlyHint: false, //? Indicate that this tool does not modify state
    destructiveHint: false, //? Indicate that this tool does not delete or remove data
    idempotentHint: false, //? Indicate that this tool may produce different results when called multiple times with the same input
    openWorldHint: true, //? Indicate that this tool may have side effects outside of the system (e.g., interacting with external services or APIs)
  },
  async (args) => {
    const params = args as ICreateUserParams;
    try {
      const id = await createUser(params);
      return {
        content: [
          {
            type: "text",
            text: `User created successfully with ID: ${id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : "Failed to create user.",
          },
        ],
      };
    }
  }
);

//? We use stdio for local testing and connection with local clients
const transport = new StdioServerTransport();
await server.connect(transport);

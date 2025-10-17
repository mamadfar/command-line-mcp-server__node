import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createUser, getUsers, ICreateUserParams } from "./lib/helpers/user.js";
import { CreateMessageResultSchema } from "@modelcontextprotocol/sdk/types.js";

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
//? ResourceTemplate used to define a resource with parameters that come from the URI or user input
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
  createUserSchema,
  {
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

//? Using sampling/createMessage to generate fake user data
//? This requires the server to have access to a language model that can generate text
//? The generated text is then parsed as JSON to extract the user data
//? In a real-world scenario, you would want to add more error handling and validation here
server.tool(
  "create-random-user",
  "Create a random user with fake data",
  {
    title: "Create Random User",
    description: "Creates a new user with random fake data",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  async () => {
    const res = await server.server.request(
      {
        method: "sampling/createMessage",
        params: {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Generate fake user data. The user should have a realistic name, email, address, and phone number.
            Return this data as a JSON object with no other text or formatter so it can be used with JSON.parse.`,
              },
            },
          ],
          maxTokens: 1024,
        },
      },
      CreateMessageResultSchema
    );
    if (res.content.type !== "text") {
      return {
        content: [
          {
            type: "text",
            text: "Failed to generate user data.",
          },
        ],
      };
    }

    try {
      const fakeUser = JSON.parse(
        res.content.text
          .trim()
          .replace(/^```json/, "")
          .replace(/```$/, "")
          .trim()
      );

      const id = await createUser(fakeUser);
      return {
        content: [
          {
            type: "text",
            text: `Random user created successfully with ID: ${id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to parse generated user data: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
      };
    }
  }
);

//* ----------------------------------- Prompts ----------------------------------- *//

server.prompt(
  "generate-fake-user",
  "Generate a fake user based on a given name",
  {
    name: z.string().describe("The name of the user to generate"),
  },
  async ({ name }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Generate a fake user with the name ${name}. The user should have a realistic email, address, and phone number.`,
          },
        },
      ],
    };
  }
);

//? We use stdio for local testing and connection with local clients
const transport = new StdioServerTransport();
await server.connect(transport);

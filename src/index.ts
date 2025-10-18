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
    prompts: {},
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
  "Create a new user in the database",
  {
    name: z.string(),
    email: z.string(),
    address: z.string(),
    phone: z.string(),
  },
  {
    title: "Create User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  async (params) => {
    try {
      const id = await createUser(params);

      return {
        content: [{ type: "text", text: `User ${id} created successfully` }],
      };
    } catch {
      return {
        content: [{ type: "text", text: "Failed to save user" }],
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
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  async () => {
    try {
      const res = await server.server.request(
        {
          method: "sampling/createMessage",
          params: {
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Generate fake user data with EXACTLY these fields:
              {
                "name": "Full Name Here",
                "email": "email@example.com",
                "address": "123 Street Name, City, State ZIP",
                "phone": "+1-555-1234"
              }
              Return ONLY valid JSON with these exact field names. No additional fields, no nested objects, no code blocks.`,
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
              text: "Failed to generate user data: Invalid content type.",
            },
          ],
        };
      }

      // Check if we got an empty response (from stub model in inspector)
      if (!res.content.text || res.content.text.trim() === "") {
        // Generate a mock user for testing with inspector
        const mockUser = {
          name: `Test User ${Date.now()}`,
          email: `testuser${Date.now()}@example.com`,
          address: `${Math.floor(Math.random() * 999) + 1} Test Street, Test City, TC 12345`,
          phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        };

        const id = await createUser(mockUser);
        return {
          content: [
            {
              type: "text",
              text: `Random user created successfully with ID: ${id} (using mock data because no LLM is available)`,
            },
          ],
        };
      }

      // Parse the LLM response
      const cleanedText = res.content.text
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      let fakeUser;
      try {
        fakeUser = JSON.parse(cleanedText);
      } catch (parseError) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to parse user data: ${
                parseError instanceof Error ? parseError.message : "Invalid JSON"
              }. Raw response: ${cleanedText.substring(0, 200)}`,
            },
          ],
        };
      }

      // Normalize and validate fields - handle common variations
      const normalizedUser = {
        name:
          fakeUser.name ||
          (fakeUser.firstName && fakeUser.lastName
            ? `${fakeUser.firstName} ${fakeUser.lastName}`
            : null),
        email: fakeUser.email,
        address:
          typeof fakeUser.address === "string"
            ? fakeUser.address
            : fakeUser.address?.street
            ? `${fakeUser.address.street}, ${fakeUser.address.city || ""}, ${
                fakeUser.address.state || ""
              } ${fakeUser.address.zipCode || fakeUser.address.zipcode || ""}`.trim()
            : fakeUser.street || fakeUser.address
            ? `${fakeUser.street || fakeUser.address || ""}, ${fakeUser.city || ""}, ${
                fakeUser.state || ""
              } ${fakeUser.zipCode || fakeUser.zipcode || ""}`.trim()
            : null,
        phone: fakeUser.phone || fakeUser.phoneNumber || fakeUser.phone_number,
      };

      // Validate the required fields after normalization
      if (
        !normalizedUser.name ||
        !normalizedUser.email ||
        !normalizedUser.address ||
        !normalizedUser.phone
      ) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to generate user data: Missing required fields after normalization. Got: ${JSON.stringify(
                normalizedUser
              )}`,
            },
          ],
        };
      }

      const id = await createUser(normalizedUser);
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
            text: `Failed to create random user: ${
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
//? IMPORTANT: Do not use console.log or any stdout output in MCP servers
//? All communication happens via JSON-RPC over stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();

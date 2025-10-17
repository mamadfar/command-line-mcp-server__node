## @modelcontextprotocol/inspector

- `@modelcontextprotocol/inspector` is a package that allows you to inspect and debug your MCP server in real-time. It provides a web-based interface where you can view logs, monitor performance, and interact with the server.

- The reason why I added `set DANGEROUSLY_OMIT_AUTH=true` is to disable inspector authentication for development purposes, otherwise with any changes we have to re-run the inspector and re-authenticate again.

## Capabilities

- Sampling: is a feature that allows you to generate text using a language model. It can be used to create fake data, generate responses to prompts, or perform other text generation tasks.
- Tools: are functions that can be called by the MCP server to perform specific tasks. They can be used to interact with databases, call external APIs, or perform other operations.
- Resources: are external services or APIs that the MCP server can interact with. They can be used to fetch data, perform computations, or access other services or files.
  - Resource Templates: are templates that define how to interact with a resource. They can be used to specify the parameters, headers, and other details needed to access the resource. We can pass parameters to the resource template using URI placeholders, query parameters, or request bodies.
- Prompts: are templates that define how to structure the input and output of a tool or resource. They can be used to format requests, parse responses, or provide context for the operation.

## @inquirer/prompts

- `@inquirer/prompts` is a package that provides a set of pre-defined prompts for use with the Inquirer.js library. It includes prompts for text input, multiple choice, checkboxes, and more. You can use these prompts to create interactive command-line interfaces for your MCP server.

## Tips

- Usually our MCP server and client are in a separate projects

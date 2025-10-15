- `@modelcontextprotocol/inspector` is a package that allows you to inspect and debug your MCP server in real-time. It provides a web-based interface where you can view logs, monitor performance, and interact with the server.

- The reason why I added `set DANGEROUSLY_OMIT_AUTH=true` is to disable inspector authentication for development purposes, otherwise with any changes we have to re-run the inspector and re-authenticate again.

-

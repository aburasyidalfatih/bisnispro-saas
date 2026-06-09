import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const server = new Server(
  {
    name: "react-doctor-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "scan_react_codebase",
        description: "Run React Doctor to diagnose React codebase health for security, performance, and architecture.",
        inputSchema: {
          type: "object",
          properties: {
            directory: {
              type: "string",
              description: "Directory to scan. Defaults to '.' (current directory)",
            },
            verbose: {
              type: "boolean",
              description: "Whether to return verbose output detailing every rule and per-file details.",
            },
            json: {
              type: "boolean",
              description: "Whether to output a structured JSON report.",
            }
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "scan_react_codebase") {
    const dir = request.params.arguments?.directory || ".";
    const verbose = request.params.arguments?.verbose ? "--verbose" : "";
    const jsonFlag = request.params.arguments?.json ? "--json" : "";
    
    try {
      const command = `npx -y react-doctor@latest ${dir} ${verbose} ${jsonFlag} --no-color`;
      const { stdout, stderr } = await execAsync(command, { maxBuffer: 1024 * 1024 * 50 }); // 50MB buffer
      
      return {
        content: [{ type: "text", text: stdout || stderr || "Command completed with no output." }],
      };
    } catch (e) {
      // React Doctor usually exits with code 1 if it finds issues, which throws an error in exec.
      // We still want to return the output.
      if (e.stdout || e.stderr) {
         return {
           content: [{ type: "text", text: e.stdout || e.stderr }]
         };
      }
      
      return {
        content: [{ type: "text", text: `Error: ${e.message}` }],
        isError: true,
      };
    }
  }

  throw new Error("Unknown tool");
});

const transport = new StdioServerTransport();
await server.connect(transport);

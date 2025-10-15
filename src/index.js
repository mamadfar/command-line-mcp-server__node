"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var zod_1 = require("zod");
var promises_1 = require("fs/promises");
var server = new mcp_js_1.McpServer({
    name: "My MCP Server",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
        // prompts: {},
    },
});
server.registerTool("create-user", {
    title: "Create User",
    description: "Creates a new user in the database",
    inputSchema: {
        name: zod_1.z.string(),
        email: zod_1.z.string().email(),
        address: zod_1.z.string(),
        phone: zod_1.z.string(),
    },
    annotations: {
        readOnlyHint: false, //? Indicate that this tool does not modify state
        destructiveHint: false, //? Indicate that this tool does not delete or remove data
        idempotentHint: false, //? Indicate that this tool may produce different results when called multiple times with the same input
        openWorldHint: true, //? Indicate that this tool may have side effects outside of the system (e.g., interacting with external services or APIs)
    },
}, function (params) { return __awaiter(void 0, void 0, void 0, function () {
    var id, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, createUser(params)];
            case 1:
                id = _a.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "User created successfully with ID: ".concat(id),
                            },
                        ],
                    }];
            case 2:
                error_1 = _a.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: error_1 instanceof Error ? error_1.message : "Failed to create user.",
                            },
                        ],
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); });
var createUser = function (user) { return __awaiter(void 0, void 0, void 0, function () {
    var fileContent, users, id;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, promises_1.readFile)("./src/lib/db/users.json", "utf-8")];
            case 1:
                fileContent = _a.sent();
                users = JSON.parse(fileContent);
                id = users.length + 1;
                users.push(__assign({ id: id }, user));
                return [4 /*yield*/, (0, promises_1.writeFile)("./src/lib/db/users.json", JSON.stringify(users, null, 2))];
            case 2:
                _a.sent();
                return [2 /*return*/, id];
        }
    });
}); };
//? We use stdio for local testing and connection with local clients
var transport = new stdio_js_1.StdioServerTransport();
await server.connect(transport);

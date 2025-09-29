// Minimal MCP-compliant server for HighLevel
import 'dotenv/config';
import fetch from 'node-fetch';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { HttpServerTransport } from '@modelcontextprotocol/sdk/server/http.js';

async function createContact(args) {
  const { firstName, lastName, email, phone } = args || {};
  if (!firstName && !lastName) return { error: "firstName or lastName is required" };
  const resp = await fetch('https://services.leadconnectorhq.com/contacts/', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: process.env.ACCESS_TOKEN,
      Version: '2021-07-28',
    },
    body: JSON.stringify({ firstName, lastName, email, phone })
  });
  const data = await resp.json();
  if (!resp.ok) return { error: data };
  return { ok: true, data };
}

async function sendMessage(args) {
  const { contactId, message } = args || {};
  if (!contactId || !message) return { error: "contactId and message are required" };
  const resp = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: process.env.ACCESS_TOKEN,
      Version: '2021-07-28',
    },
    body: JSON.stringify({ contactId, message, type: 'SMS' })
  });
  const data = await resp.json();
  if (!resp.ok) return { error: data };
  return { ok: true, data };
}

const server = new Server(
  { name: 'highlevel-mcp', version: '1.0.0' },
  {
    tools: {
      create_contact: {
        description: 'Create a HighLevel contact',
        inputSchema: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
          },
          additionalProperties: false
        },
        handler: async ({ params }) => (await createContact(params))
      },
      send_message: {
        description: 'Send an SMS to an existing HighLevel contact',
        inputSchema: {
          type: 'object',
          properties: {
            contactId: { type: 'string' },
            message: { type: 'string' },
          },
          required: ['contactId', 'message'],
          additionalProperties: false
        },
        handler: async ({ params }) => (await sendMessage(params))
      },
    },
  }
);

const port = process.env.PORT || 10000;
const httpTransport = new HttpServerTransport({ port });
await server.connect(httpTransport);

console.log(`MCP server 'highlevel-mcp' listening on port ${port}`);

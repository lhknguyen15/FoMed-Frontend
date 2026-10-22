import type { IncomingMessage, ServerResponse } from 'node:http'

export default function healthNewsHandler(req: IncomingMessage, res: ServerResponse): Promise<void>

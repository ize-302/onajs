import path from "node:path";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { scanRoutes, type RouteNode } from "./scan-routes";

const VIRTUAL = "virtual:ona-manifest";
const RESOLVED = "\0" + VIRTUAL;

export interface FileRouterOptions {
	appDir?: string;
}

export function fileRouter(options: FileRouterOptions = {}): Plugin {
	const appDir = options.appDir ?? "src/app";
	let root = process.cwd();

	return {
		name: "ona:file-router",

		configResolved(config: ResolvedConfig) {
			root = config.root;
		},

		resolveId(id: string) {
			if (id === VIRTUAL) return RESOLVED;
		},

		async load(id: string) {
			if (id !== RESOLVED) return;
			const tree = await scanRoutes(root, appDir);
			return codegen(tree);
		},

		configureServer(server: ViteDevServer) {
			const invalidate = (file: string) => {
				if (!isRouteFile(file, root, appDir)) return;
				const mod = server.moduleGraph.getModuleById(RESOLVED);
				if (mod) server.moduleGraph.invalidateModule(mod);
				server.ws.send({ type: "full-reload" });
			};
			server.watcher.on("add", invalidate);
			server.watcher.on("unlink", invalidate);
		},
	};
}

// checks if file is a page or layout. Rebuilds if true, else ignores
export function isRouteFile(
	file: string,
	root: string,
	appDir: string,
): boolean {
	// windows writes file locations differently from mac/linux i.e it use the
	// backward slash "\" as opposed to mac/linux forward slash "/" e.g
	// src\app\page.tsx which is different from src/app/page.tsx
	// We fix this incosistency by flipping the windows "\" to become "/"
	// just before file check
	const toPosix = (p: string) => p.replace(/\\/g, "/");
	const absAppDir = toPosix(path.join(root, appDir)).replace(/\/$/, "");
	const f = toPosix(file);
	return f.startsWith(absAppDir + "/") && /\/(page|layout)\.tsx?$/.test(f);
}

export function codegen(tree: RouteNode): string {
	const lines: string[] = [];
	let counter = 0;
	const idMap = new Map<string, string>();

	function collectFiles(node: RouteNode) {
		if (node.layoutFile && !idMap.has(node.layoutFile)) {
			const id = `_c${counter++}`;
			idMap.set(node.layoutFile, id);
			lines.push(
				`const ${id} = () => import(${JSON.stringify(node.layoutFile)})`,
			);
		}
		if (node.pageFile && !idMap.has(node.pageFile)) {
			const id = `_c${counter++}`;
			idMap.set(node.pageFile, id);
			lines.push(
				`const ${id} = () => import(${JSON.stringify(node.pageFile)})`,
			);
		}
		for (const child of node.children) collectFiles(child);
	}

	collectFiles(tree);

	function serializeNode(node: RouteNode): string {
		const parts: string[] = [`segment: ${JSON.stringify(node.segment)}`];
		if (node.layoutFile) parts.push(`layout: ${idMap.get(node.layoutFile)}`);
		if (node.pageFile) parts.push(`page: ${idMap.get(node.pageFile)}`);
		parts.push(`children: [${node.children.map(serializeNode).join(", ")}]`);
		return `{ ${parts.join(", ")} }`;
	}

	lines.push(`export const routes = ${serializeNode(tree)}`);
	return lines.join("\n");
}
